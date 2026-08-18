-- SIGCA: permisos efectivos, reclamos privados/compartidos y circuito de afiliación.
-- Idempotente: puede ejecutarse más de una vez desde Supabase SQL Editor o CLI.

create extension if not exists pgcrypto;

alter table public.usuarios add column if not exists administrador_general boolean not null default false;

update public.usuarios
set administrador_general = true, rol = 'Administrador', estado = 'Aprobado', activo = true
where lower(trim(coalesce(nombre, ''))) in ('cristian', 'christian')
  and lower(trim(coalesce(apellido, ''))) = 'aguilar';

create table if not exists public.sistema_modulos (
  clave text primary key,
  nombre text not null,
  descripcion text,
  orden integer not null default 0,
  activo boolean not null default true
);

insert into public.sistema_modulos (clave, nombre, descripcion, orden, activo) values
  ('afiliados','Afiliados','Consulta y modificación del padrón y circuito de afiliaciones.',10,true),
  ('beneficios','Beneficios','Consulta, entrega y administración de beneficios.',20,true),
  ('empresas','Empresas','Consulta, altas, bajas y modificaciones de empresas.',30,true),
  ('configuracion','Configuración','Administración de parámetros institucionales.',40,true),
  ('reportes','Reportes','Consulta y generación de reportes.',50,true)
on conflict (clave) do update set nombre=excluded.nombre, descripcion=excluded.descripcion, orden=excluded.orden, activo=excluded.activo;

create table if not exists public.usuarios_permisos_sistema (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  modulo_clave text not null references public.sistema_modulos(clave) on delete cascade,
  habilitado boolean not null default false,
  puede_consultar boolean not null default false,
  puede_crear boolean not null default false,
  puede_editar boolean not null default false,
  puede_aprobar boolean not null default false,
  puede_configurar boolean not null default false,
  alcance text not null default 'ninguno',
  empresa_id bigint,
  sede text,
  asignado_por uuid references auth.users(id),
  actualizado_en timestamptz not null default now(),
  constraint usuarios_permisos_alcance_check check (alcance in ('ninguno','completo','empresa','sede')),
  constraint usuarios_permisos_usuario_modulo_key unique (usuario_id, modulo_clave)
);

alter table public.usuarios_permisos_sistema add column if not exists habilitado boolean not null default false;
alter table public.usuarios_permisos_sistema add column if not exists puede_consultar boolean not null default false;
alter table public.usuarios_permisos_sistema add column if not exists puede_crear boolean not null default false;
alter table public.usuarios_permisos_sistema add column if not exists puede_editar boolean not null default false;
alter table public.usuarios_permisos_sistema add column if not exists puede_aprobar boolean not null default false;
alter table public.usuarios_permisos_sistema add column if not exists puede_configurar boolean not null default false;
alter table public.usuarios_permisos_sistema add column if not exists alcance text not null default 'ninguno';
alter table public.usuarios_permisos_sistema add column if not exists empresa_id bigint;
alter table public.usuarios_permisos_sistema add column if not exists sede text;
alter table public.usuarios_permisos_sistema add column if not exists asignado_por uuid;
alter table public.usuarios_permisos_sistema add column if not exists actualizado_en timestamptz not null default now();
create unique index if not exists usuarios_permisos_usuario_modulo_uidx on public.usuarios_permisos_sistema(usuario_id, modulo_clave);

create or replace function public.sigca_es_administrador(p_usuario_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.usuarios u where u.id=p_usuario_id and u.activo=true and lower(u.estado)='aprobado' and lower(u.rol)='administrador');
$$;

create or replace function public.sigca_es_administrador_general(p_usuario_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.usuarios u where u.id=p_usuario_id and u.activo=true and lower(u.estado)='aprobado' and u.administrador_general=true);
$$;

create or replace function public.sigca_proteger_administradores()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if old.rol is distinct from new.rol and (lower(coalesce(old.rol,''))='administrador' or lower(coalesce(new.rol,''))='administrador')
     and not public.sigca_es_administrador_general(auth.uid())
     and coalesce(auth.role(),'') <> 'service_role' then
    raise exception 'Sólo el administrador general puede otorgar o quitar el rol Administrador';
  end if;
  if old.administrador_general is distinct from new.administrador_general
     and coalesce(auth.role(),'') <> 'service_role' then
    raise exception 'La condición de administrador general no se modifica desde la aplicación';
  end if;
  return new;
end; $$;

drop trigger if exists sigca_proteger_administradores on public.usuarios;
create trigger sigca_proteger_administradores before update on public.usuarios for each row execute function public.sigca_proteger_administradores();

alter table public.usuarios_permisos_sistema enable row level security;
drop policy if exists "permisos leer propios o administradores" on public.usuarios_permisos_sistema;
drop policy if exists "permisos administrar" on public.usuarios_permisos_sistema;
create policy "permisos leer propios o administradores" on public.usuarios_permisos_sistema for select to authenticated using (usuario_id=auth.uid() or public.sigca_es_administrador());
create policy "permisos administrar" on public.usuarios_permisos_sistema for all to authenticated using (public.sigca_es_administrador()) with check (public.sigca_es_administrador() and asignado_por=auth.uid());

-- Reclamos: una persona puede mantenerlos privados, compartirlos con una empresa
-- o elegir destinatarios concretos.
alter table public.reclamos_sindicales add column if not exists empresa_id bigint;
alter table public.reclamos_sindicales add column if not exists audiencia_tipo text not null default 'privado';
alter table public.reclamos_sindicales add column if not exists fecha_recordatorio date;
alter table public.reclamos_sindicales add column if not exists reclamo_realizado boolean not null default false;
alter table public.reclamos_sindicales add column if not exists finalizado_en timestamptz;
alter table public.reclamos_sindicales add column if not exists responsable_id uuid;
alter table public.reclamos_sindicales add column if not exists creado_por uuid;

create table if not exists public.reclamos_destinatarios (
  reclamo_id uuid not null references public.reclamos_sindicales(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  creado_en timestamptz not null default now(),
  primary key (reclamo_id, usuario_id)
);

create table if not exists public.notificaciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null,
  mensaje text,
  enlace text,
  leida boolean not null default false,
  clave_unica text,
  creado_en timestamptz not null default now()
);
alter table public.notificaciones add column if not exists usuario_id uuid;
alter table public.notificaciones add column if not exists titulo text;
alter table public.notificaciones add column if not exists mensaje text;
alter table public.notificaciones add column if not exists enlace text;
alter table public.notificaciones add column if not exists leida boolean not null default false;
alter table public.notificaciones add column if not exists clave_unica text;
alter table public.notificaciones add column if not exists creado_en timestamptz not null default now();
create unique index if not exists notificaciones_usuario_clave_uidx on public.notificaciones(usuario_id, clave_unica) where clave_unica is not null;

create or replace function public.sigca_puede_ver_reclamo(r public.reclamos_sindicales)
returns boolean language sql stable security definer set search_path=public as $$
  select public.sigca_es_administrador()
    or r.creado_por=auth.uid()
    or r.responsable_id=auth.uid()
    or exists(select 1 from public.reclamos_destinatarios d where d.reclamo_id=r.id and d.usuario_id=auth.uid())
    or (r.audiencia_tipo='empresa' and exists(
      select 1 from public.usuarios u where u.id=auth.uid() and u.activo=true
        and lower(trim(coalesce(u.empresa,'')))=lower(trim(coalesce(r.empresa_nombre,'')))
    ));
$$;

alter table public.reclamos_sindicales enable row level security;
alter table public.reclamos_destinatarios enable row level security;
drop policy if exists "reclamos visibles" on public.reclamos_sindicales;
drop policy if exists "reclamos crear" on public.reclamos_sindicales;
drop policy if exists "reclamos actualizar" on public.reclamos_sindicales;
drop policy if exists "reclamos eliminar" on public.reclamos_sindicales;
create policy "reclamos visibles" on public.reclamos_sindicales for select to authenticated using (public.sigca_puede_ver_reclamo(reclamos_sindicales));
create policy "reclamos crear" on public.reclamos_sindicales for insert to authenticated with check (creado_por=auth.uid());
create policy "reclamos actualizar" on public.reclamos_sindicales for update to authenticated using (public.sigca_es_administrador() or creado_por=auth.uid() or responsable_id=auth.uid()) with check (public.sigca_es_administrador() or creado_por=auth.uid() or responsable_id=auth.uid());
create policy "reclamos eliminar" on public.reclamos_sindicales for delete to authenticated using (public.sigca_es_administrador() or creado_por=auth.uid());
drop policy if exists "destinatarios visibles" on public.reclamos_destinatarios;
drop policy if exists "destinatarios asignar" on public.reclamos_destinatarios;
create policy "destinatarios visibles" on public.reclamos_destinatarios for select to authenticated using (usuario_id=auth.uid() or exists(select 1 from public.reclamos_sindicales r where r.id=reclamo_id and (r.creado_por=auth.uid() or public.sigca_es_administrador())));
create policy "destinatarios asignar" on public.reclamos_destinatarios for all to authenticated using (exists(select 1 from public.reclamos_sindicales r where r.id=reclamo_id and (r.creado_por=auth.uid() or public.sigca_es_administrador()))) with check (exists(select 1 from public.reclamos_sindicales r where r.id=reclamo_id and (r.creado_por=auth.uid() or public.sigca_es_administrador())));

alter table public.notificaciones enable row level security;
drop policy if exists "notificaciones propias" on public.notificaciones;
drop policy if exists "notificaciones marcar propias" on public.notificaciones;
create policy "notificaciones propias" on public.notificaciones for select to authenticated using (usuario_id=auth.uid());
create policy "notificaciones marcar propias" on public.notificaciones for update to authenticated using (usuario_id=auth.uid()) with check (usuario_id=auth.uid());

create or replace function public.sigca_notificar_reclamo_nuevo()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.notificaciones(usuario_id,titulo,mensaje,enlace,clave_unica)
  values(new.creado_por,'Seguimiento de reclamo',new.titulo,'/gestion/sindical/reclamos/'||new.id,'reclamo:'||new.id||':creado')
  on conflict do nothing;
  return new;
end; $$;
drop trigger if exists sigca_reclamo_nuevo on public.reclamos_sindicales;
create trigger sigca_reclamo_nuevo after insert on public.reclamos_sindicales for each row execute function public.sigca_notificar_reclamo_nuevo();

create or replace function public.sigca_notificar_destinatario_reclamo()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_titulo text;
begin
  select titulo into v_titulo from public.reclamos_sindicales where id=new.reclamo_id;
  insert into public.notificaciones(usuario_id,titulo,mensaje,enlace,clave_unica)
  values(new.usuario_id,'Reclamo compartido',v_titulo,'/gestion/sindical/reclamos/'||new.reclamo_id,'reclamo:'||new.reclamo_id||':compartido')
  on conflict do nothing;
  return new;
end; $$;
drop trigger if exists sigca_reclamo_destinatario_nuevo on public.reclamos_destinatarios;
create trigger sigca_reclamo_destinatario_nuevo after insert on public.reclamos_destinatarios for each row execute function public.sigca_notificar_destinatario_reclamo();

-- Afiliaciones: descarga -> firma digitalizada -> presentación física -> aprobación.
alter table public.afiliaciones add column if not exists descargada_en timestamptz;
alter table public.afiliaciones add column if not exists archivo_firmado_path text;
alter table public.afiliaciones add column if not exists archivo_firmado_nombre text;
alter table public.afiliaciones add column if not exists archivo_firmado_en timestamptz;
alter table public.afiliaciones add column if not exists presentada_fisicamente_en timestamptz;
alter table public.afiliaciones add column if not exists presentada_fisicamente_por uuid;

create or replace function public.sigca_notificar_afiliacion()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_op='INSERT' then
    insert into public.notificaciones(usuario_id,titulo,mensaje,enlace,clave_unica)
    values(new.creado_por,'Ficha de afiliación pendiente','Descargá, hacé firmar y subí la ficha de '||coalesce(new.apellido_nombres,'la nueva afiliación'),'/gestion/sindical/afiliaciones/solicitudes','afiliacion:'||new.id||':pendiente-firma') on conflict do nothing;
  elsif new.estado='firmada' and old.estado is distinct from new.estado then
    insert into public.notificaciones(usuario_id,titulo,mensaje,enlace,clave_unica)
    select u.id,'Nueva ficha firmada para cargar',coalesce(new.apellido_nombres,'Nueva afiliación')||' ya tiene ficha firmada.','/gestion/sindical/afiliaciones/solicitudes','afiliacion:'||new.id||':firmada'
    from public.usuarios u left join public.usuarios_permisos_sistema p on p.usuario_id=u.id and p.modulo_clave='afiliados'
    where u.activo=true and lower(u.estado)='aprobado' and (lower(u.rol)='administrador' or (p.habilitado=true and p.puede_aprobar=true)) on conflict do nothing;
    insert into public.notificaciones(usuario_id,titulo,mensaje,enlace,clave_unica)
    values(new.creado_por,'Presentación física pendiente','Presentá físicamente la ficha firmada ante el secretario administrativo.','/gestion/sindical/afiliaciones/solicitudes','afiliacion:'||new.id||':presentar') on conflict do nothing;
  elsif new.estado='presentada' and old.estado is distinct from new.estado then
    new.presentada_fisicamente_en := coalesce(new.presentada_fisicamente_en,now());
    new.presentada_fisicamente_por := coalesce(new.presentada_fisicamente_por,auth.uid());
    update public.notificaciones set leida=true where usuario_id=new.creado_por and clave_unica='afiliacion:'||new.id||':presentar';
  elsif new.estado in ('aprobada','rechazada','archivada') and old.estado is distinct from new.estado then
    update public.notificaciones set leida=true where clave_unica like 'afiliacion:'||new.id||':%';
  end if;
  return new;
end; $$;
drop trigger if exists sigca_afiliacion_notificar_before on public.afiliaciones;
create trigger sigca_afiliacion_notificar_before before insert or update on public.afiliaciones for each row execute function public.sigca_notificar_afiliacion();

create or replace function public.sigca_generar_recordatorios()
returns integer language plpgsql security definer set search_path=public as $$
declare generated integer := 0; affected integer;
begin
  insert into public.notificaciones(usuario_id,titulo,mensaje,enlace,clave_unica)
  select coalesce(r.responsable_id,r.creado_por),'Reclamo pendiente de realizar','Debés realizar: '||r.titulo,'/gestion/sindical/reclamos/'||r.id,'reclamo:'||r.id||':realizar:'||current_date
  from public.reclamos_sindicales r where r.reclamo_realizado=false and r.fecha_recordatorio<=current_date and r.estado not in ('resuelto','cerrado','archivado')
  on conflict do nothing;
  get diagnostics affected=row_count; generated:=generated+affected;

  insert into public.notificaciones(usuario_id,titulo,mensaje,enlace,clave_unica)
  select coalesce(r.responsable_id,r.creado_por),'Respuesta de reclamo próxima','Mañana debés tener respuesta de: '||r.titulo,'/gestion/sindical/reclamos/'||r.id,'reclamo:'||r.id||':respuesta-manana:'||r.fecha_limite
  from public.reclamos_sindicales r where r.reclamo_realizado=true and r.fecha_limite=current_date+1 and r.estado not in ('resuelto','cerrado','archivado')
  on conflict do nothing;
  get diagnostics affected=row_count; generated:=generated+affected;

  insert into public.notificaciones(usuario_id,titulo,mensaje,enlace,clave_unica)
  select a.creado_por,'Ficha firmada pendiente','Subí la ficha firmada de '||coalesce(a.apellido_nombres,'la afiliación'),'/gestion/sindical/afiliaciones/solicitudes','afiliacion:'||a.id||':recordatorio:'||current_date
  from public.afiliaciones a where a.estado='pendiente_firma' and a.descargada_en is not null
  on conflict do nothing;
  get diagnostics affected=row_count; generated:=generated+affected;
  return generated;
end; $$;

grant execute on function public.sigca_es_administrador(uuid) to authenticated;
grant execute on function public.sigca_es_administrador_general(uuid) to authenticated;
revoke all on function public.sigca_generar_recordatorios() from public, anon, authenticated;
grant execute on function public.sigca_generar_recordatorios() to service_role;

