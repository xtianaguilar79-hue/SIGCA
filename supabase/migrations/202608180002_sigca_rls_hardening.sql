-- Endurecimiento posterior a la migración funcional.

drop index if exists public.usuarios_permisos_usuario_modulo_uidx;

-- Un solo juego de políticas por operación evita reglas duplicadas y mantiene
-- la autorización en un punto único.
drop policy if exists "administradores crean permisos" on public.usuarios_permisos_sistema;
drop policy if exists "administradores eliminan permisos" on public.usuarios_permisos_sistema;
drop policy if exists "administradores modifican permisos" on public.usuarios_permisos_sistema;
drop policy if exists "usuario consulta sus permisos de sistema" on public.usuarios_permisos_sistema;
drop policy if exists "usuarios consultan sus permisos" on public.usuarios_permisos_sistema;

drop policy if exists "consultar reclamos autorizados" on public.reclamos_sindicales;
drop policy if exists "crear reclamos autorizados" on public.reclamos_sindicales;
drop policy if exists "modificar reclamos autorizados" on public.reclamos_sindicales;

drop policy if exists "consultar notificaciones propias" on public.notificaciones;
drop policy if exists "actualizar notificaciones propias" on public.notificaciones;

drop policy if exists "destinatarios asignar" on public.reclamos_destinatarios;
create policy "destinatarios crear" on public.reclamos_destinatarios for insert to authenticated with check (
  exists(select 1 from public.reclamos_sindicales r where r.id=reclamo_id and (r.creado_por=auth.uid() or public.sigca_es_administrador()))
);
create policy "destinatarios modificar" on public.reclamos_destinatarios for update to authenticated using (
  exists(select 1 from public.reclamos_sindicales r where r.id=reclamo_id and (r.creado_por=auth.uid() or public.sigca_es_administrador()))
) with check (
  exists(select 1 from public.reclamos_sindicales r where r.id=reclamo_id and (r.creado_por=auth.uid() or public.sigca_es_administrador()))
);
create policy "destinatarios eliminar" on public.reclamos_destinatarios for delete to authenticated using (
  exists(select 1 from public.reclamos_sindicales r where r.id=reclamo_id and (r.creado_por=auth.uid() or public.sigca_es_administrador()))
);

-- Consolida el circuito de afiliaciones para creador, aprobadores delegados y administradores.
drop policy if exists "Consultar afiliaciones autorizadas" on public.afiliaciones;
drop policy if exists "Crear solicitudes pendientes" on public.afiliaciones;
drop policy if exists "Editar solicitudes propias pendientes" on public.afiliaciones;
drop policy if exists "Eliminar afiliaciones administradores" on public.afiliaciones;
drop policy if exists "afiliaciones consultar por permiso" on public.afiliaciones;
drop policy if exists "afiliaciones completar propias" on public.afiliaciones;
drop policy if exists "afiliaciones gestionar por permiso" on public.afiliaciones;

create policy "afiliaciones consultar" on public.afiliaciones for select to authenticated using (
  creado_por=auth.uid() or public.sigca_es_administrador() or exists(
    select 1 from public.usuarios_permisos_sistema p where p.usuario_id=auth.uid() and p.modulo_clave='afiliados'
      and p.habilitado=true and p.puede_consultar=true and p.alcance<>'ninguno'
  )
);
create policy "afiliaciones crear" on public.afiliaciones for insert to authenticated with check (
  creado_por=auth.uid() and estado='pendiente_firma' and exists(
    select 1 from public.usuarios u where u.id=auth.uid() and u.activo=true and lower(u.estado)='aprobado'
  )
);
create policy "afiliaciones actualizar" on public.afiliaciones for update to authenticated using (
  (creado_por=auth.uid() and estado='pendiente_firma') or public.sigca_es_administrador() or exists(
    select 1 from public.usuarios_permisos_sistema p where p.usuario_id=auth.uid() and p.modulo_clave='afiliados'
      and p.habilitado=true and p.puede_aprobar=true and p.alcance<>'ninguno'
  )
) with check (
  (creado_por=auth.uid() and estado in ('pendiente_firma','firmada')) or public.sigca_es_administrador() or exists(
    select 1 from public.usuarios_permisos_sistema p where p.usuario_id=auth.uid() and p.modulo_clave='afiliados'
      and p.habilitado=true and p.puede_aprobar=true and p.alcance<>'ninguno'
  )
);
create policy "afiliaciones eliminar" on public.afiliaciones for delete to authenticated using (public.sigca_es_administrador());

-- SECURITY DEFINER no debe ser invocable por visitantes anónimos. Las funciones
-- siguen disponibles para usuarios autenticados y los disparadores internos.
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as signature
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.prosecdef=true
  loop
    execute format('revoke execute on function %s from public, anon', f.signature);
    execute format('grant execute on function %s to authenticated', f.signature);
  end loop;
end $$;

revoke all on function public.sigca_generar_recordatorios() from authenticated;
grant execute on function public.sigca_generar_recordatorios() to service_role;


