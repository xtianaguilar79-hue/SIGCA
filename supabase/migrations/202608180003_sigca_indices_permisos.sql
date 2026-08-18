-- Índices de soporte y políticas sin reevaluar auth.uid() por cada fila.

create index if not exists reclamos_destinatarios_usuario_idx on public.reclamos_destinatarios(usuario_id);
create index if not exists reclamos_sindicales_creado_por_idx on public.reclamos_sindicales(creado_por);
create index if not exists reclamos_sindicales_responsable_idx on public.reclamos_sindicales(responsable_id) where responsable_id is not null;
create index if not exists notificaciones_actor_idx on public.notificaciones(actor_id) where actor_id is not null;
create index if not exists afiliaciones_afiliado_id_idx on public.afiliaciones(afiliado_id) where afiliado_id is not null;
create index if not exists usuarios_permisos_asignado_por_idx on public.usuarios_permisos_sistema(asignado_por) where asignado_por is not null;
create index if not exists usuarios_permisos_modulo_idx on public.usuarios_permisos_sistema(modulo_clave);

drop policy if exists "permisos leer propios o administradores" on public.usuarios_permisos_sistema;
drop policy if exists "permisos administrar" on public.usuarios_permisos_sistema;
create policy "permisos leer" on public.usuarios_permisos_sistema for select to authenticated using (
  usuario_id=(select auth.uid()) or (select public.sigca_es_administrador())
);
create policy "permisos crear" on public.usuarios_permisos_sistema for insert to authenticated with check (
  (select public.sigca_es_administrador()) and asignado_por=(select auth.uid())
);
create policy "permisos modificar" on public.usuarios_permisos_sistema for update to authenticated using (
  (select public.sigca_es_administrador())
) with check ((select public.sigca_es_administrador()) and asignado_por=(select auth.uid()));
create policy "permisos eliminar" on public.usuarios_permisos_sistema for delete to authenticated using (
  (select public.sigca_es_administrador())
);

drop policy if exists "notificaciones propias" on public.notificaciones;
drop policy if exists "notificaciones marcar propias" on public.notificaciones;
drop policy if exists "eliminar notificaciones propias" on public.notificaciones;
create policy "notificaciones propias" on public.notificaciones for select to authenticated using (destinatario_id=(select auth.uid()));
create policy "notificaciones marcar propias" on public.notificaciones for update to authenticated using (destinatario_id=(select auth.uid())) with check (destinatario_id=(select auth.uid()));
create policy "notificaciones eliminar propias" on public.notificaciones for delete to authenticated using (destinatario_id=(select auth.uid()));

drop policy if exists "reclamos crear" on public.reclamos_sindicales;
drop policy if exists "reclamos actualizar" on public.reclamos_sindicales;
drop policy if exists "reclamos eliminar" on public.reclamos_sindicales;
create policy "reclamos crear" on public.reclamos_sindicales for insert to authenticated with check (creado_por=(select auth.uid()));
create policy "reclamos actualizar" on public.reclamos_sindicales for update to authenticated using (
  (select public.sigca_es_administrador()) or creado_por=(select auth.uid()) or responsable_id=(select auth.uid())
) with check ((select public.sigca_es_administrador()) or creado_por=(select auth.uid()) or responsable_id=(select auth.uid()));
create policy "reclamos eliminar" on public.reclamos_sindicales for delete to authenticated using (
  (select public.sigca_es_administrador()) or creado_por=(select auth.uid())
);

drop policy if exists "destinatarios visibles" on public.reclamos_destinatarios;
create policy "destinatarios visibles" on public.reclamos_destinatarios for select to authenticated using (
  usuario_id=(select auth.uid()) or exists(select 1 from public.reclamos_sindicales r where r.id=reclamo_id and (r.creado_por=(select auth.uid()) or (select public.sigca_es_administrador())))
);


