-- Asistente interno: consultas con la identidad del usuario, nunca service_role.
-- No modifica las políticas ni amplía los permisos de los módulos existentes.
begin;

create table if not exists public.sigca_asistente_cupos (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  ventana timestamptz not null,
  solicitudes integer not null
);
alter table public.sigca_asistente_cupos enable row level security;
revoke all on public.sigca_asistente_cupos from public, anon, authenticated;

-- Única operación privilegiada: contador atómico, sin preguntas ni contenido.
create or replace function public.sigca_asistente_consumir_cupo()
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_count integer;
begin
  if auth.uid() is null or not exists (
    select 1 from public.usuarios where id=auth.uid() and activo=true and lower(estado)='aprobado'
  ) then raise exception 'Acceso no autorizado' using errcode='42501'; end if;
  insert into public.sigca_asistente_cupos as c (usuario_id, ventana, solicitudes)
  values (auth.uid(), date_trunc('minute', now()), 1)
  on conflict (usuario_id) do update set
    ventana=excluded.ventana,
    solicitudes=case when c.ventana=excluded.ventana then least(c.solicitudes+1,21) else 1 end
  returning solicitudes into v_count;
  return v_count <= 20;
end $$;
revoke all on function public.sigca_asistente_consumir_cupo() from public, anon;
grant execute on function public.sigca_asistente_consumir_cupo() to authenticated;

create or replace function public.sigca_asistente_buscar(
  p_modulo text,
  p_terminos text[] default '{}',
  p_registro text default null,
  p_pendientes boolean default false
)
returns table (id text, titulo text, contenido text, relevancia real)
language plpgsql stable security invoker set search_path = '' set statement_timeout = '5s' as $$
declare
  v_table text;
  v_fields text[];
  v_query tsquery;
begin
  if auth.uid() is null or not exists (
    select 1 from public.usuarios where id=auth.uid() and activo=true and lower(estado)='aprobado'
  ) then raise exception 'Acceso no autorizado' using errcode='42501'; end if;
  if p_terminos is null or cardinality(p_terminos)>12 or exists (
    select 1 from unnest(p_terminos) term where term is null or term !~ '^[a-z0-9]{2,60}$'
  ) or length(coalesce(p_registro,''))>100 then
    raise exception 'Consulta inválida' using errcode='22023';
  end if;
  case p_modulo
    when 'actas' then
      v_table := 'actas_minutas';
      v_fields := array['tipo','fecha','empresa_nombre','lugar','estado','asunto','desarrollo','acuerdos','asuntos_pendientes','observaciones'];
    when 'reclamos' then
      v_table := 'reclamos_sindicales';
      v_fields := array['numero','empresa_nombre','categoria','estado','fecha_hecho','fecha_limite','descripcion','respuesta_o_resolucion'];
    when 'visitas' then
      v_table := 'visitas_inspecciones';
      v_fields := array['tipo','fecha','desarrollo','acciones'];
    else raise exception 'Módulo inválido' using errcode='22023';
  end case;
  -- Fail closed if a deployment has no RLS (or invokes with a bypass-RLS role).
  if not coalesce(pg_catalog.row_security_active(pg_catalog.to_regclass('public.' || v_table)), false) then
    raise exception 'RLS requerida' using errcode='42501';
  end if;
  v_query := pg_catalog.plainto_tsquery('pg_catalog.spanish', array_to_string(p_terminos,' '));
  if pg_catalog.numnode(v_query)=0 and p_registro is null and not (p_modulo='reclamos' and p_pendientes) then return; end if;

  -- The table/fields below are selected exclusively from the fixed allowlist above.
  -- SECURITY INVOKER keeps each table's existing SELECT policies in force.
  return query execute format($query$
    with documents as (
      select t.id::text as doc_id, coalesce(t.titulo,'Sin título')::text as title,
        concat_ws(E'\n', t.titulo, (
          select string_agg(k || ': ' || (to_jsonb(t)->>k), E'\n' order by ord)
          from unnest($1) with ordinality as fields(k,ord)
          where nullif(to_jsonb(t)->>k,'') is not null
        )) as body
      from public.%I t
      where ($2::text is null or t.id::text=$2)
        and (not $4 or coalesce(to_jsonb(t)->>'estado','') in ('borrador','abierto','en_gestion','pendiente_empresa'))
    ), ranked as (
      select *, pg_catalog.to_tsvector('pg_catalog.spanish',body) as vector from documents
    )
    select doc_id, title, left(body,24000), pg_catalog.ts_rank_cd(vector,$3)
    from ranked where pg_catalog.numnode($3)=0 or vector @@ $3
    order by pg_catalog.ts_rank_cd(vector,$3) desc, doc_id
    limit 5
  $query$, v_table)
  using v_fields, p_registro, v_query, (p_modulo='reclamos' and p_pendientes);
end $$;
revoke all on function public.sigca_asistente_buscar(text,text[],text,boolean) from public, anon;
grant execute on function public.sigca_asistente_buscar(text,text[],text,boolean) to authenticated;
commit;
