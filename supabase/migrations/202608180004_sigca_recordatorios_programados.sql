-- Ejecuta los recordatorios desde la propia base, sin depender de secretos de Vercel.
create extension if not exists pg_cron with schema pg_catalog;

do $$
declare
  existing_job bigint;
begin
  for existing_job in
    select jobid from cron.job where jobname = 'sigca-recordatorios-diarios'
  loop
    perform cron.unschedule(existing_job);
  end loop;

  perform cron.schedule(
    'sigca-recordatorios-diarios',
    '0 12 * * *',
    'select public.sigca_generar_recordatorios();'
  );
end;
$$;
