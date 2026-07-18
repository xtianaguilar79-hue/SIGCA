import Image from "next/image";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";

const STATUS_LABELS: Record<string, string> = {
  pendiente_firma: "Pendiente de firma",
  firmada: "Firmada",
  presentada: "Presentada",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  archivada: "Archivada",
};

const VALID_STATUSES = Object.keys(STATUS_LABELS);

async function updateApplicationStatus(formData: FormData) {
  "use server";

  const id = String(formData.get("id") || "");
  const estado = String(formData.get("estado") || "");
  const route = "/gestion/sindical/afiliaciones/solicitudes";

  if (!id || !VALID_STATUSES.includes(estado)) {
    redirect(`${route}?resultado=error`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("afiliaciones").update({ estado }).eq("id", id);

  if (error) redirect(`${route}?resultado=error`);
  revalidatePath(route);
  redirect(`${route}?resultado=actualizado`);
}

function text(value: unknown) {
  return String(value || "—");
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short" }).format(new Date(value));
}

export default async function SolicitudesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; resultado?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/acceso");

  const { data: profile } = await supabase
    .from("usuarios")
    .select("nombre,apellido,rol,estado,activo")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.activo === false || String(profile.estado).toLowerCase() !== "aprobado") {
    redirect("/acceso");
  }

  const { data: applications, error } = await supabase
    .from("afiliaciones")
    .select("id,estado,razon_social,apellido_nombres,tipo_documento,numero_documento,cuil,telefono,correo,creado_en")
    .order("creado_en", { ascending: false })
    .limit(250);

  const params = await searchParams;
  const query = String(params.q || "").trim().toLocaleLowerCase("es");
  const filtered = (applications || []).filter((application) => {
    if (!query) return true;
    return [application.apellido_nombres, application.razon_social, application.numero_documento, application.cuil]
      .some((value) => String(value || "").toLocaleLowerCase("es").includes(query));
  });

  const name = [profile.nombre, profile.apellido].filter(Boolean).join(" ");
  const isAdmin = String(profile.rol).toLowerCase() === "administrador";

  return (
    <main className="management">
      <aside className="side">
        <Link className="side-brand" href="/gestion">
          <Image src="/logo-aoma.png" width={39} height={39} alt="AOMA" />
          <div><strong>SIGCA</strong><span>SECCIONAL SAN JUAN</span></div>
        </Link>
        <nav>
          <Link href="/gestion">Inicio institucional</Link>
          <Link className="active" href="/gestion/sindical">Gestión sindical</Link>
          <Link href="/gestion/formacion">Formación Sindical</Link>
          <Link href="/gestion/biblioteca">Biblioteca</Link>
          <Link href="/gestion/perfil">Mi perfil</Link>
          {isAdmin && <Link href="/gestion/usuarios">Administración de usuarios</Link>}
        </nav>
        <div className="session">
          <strong>{name}</strong><span>{String(profile.rol || "Usuario autorizado")}</span><SignOutButton />
        </div>
      </aside>

      <section className="main-area applications-page">
        <Link className="library-back" href="/gestion/sindical/afiliaciones">← Volver a Afiliaciones</Link>
        <header className="main-head">
          <div>
            <p className="kicker">AFILIACIONES</p>
            <h1>Solicitudes guardadas</h1>
            <p>Consultá las solicitudes creadas y su estado actual.</p>
          </div>
        </header>

        <form className="applications-search" method="get">
          <label htmlFor="q">Buscar solicitud</label>
          <div><input id="q" name="q" defaultValue={query} placeholder="Nombre, empresa, documento o CUIL" /><button type="submit">Buscar</button></div>
        </form>

        {params.resultado === "actualizado" && <p className="applications-message success">Estado actualizado correctamente.</p>}
        {params.resultado === "error" && <p className="applications-message error">No se pudo actualizar el estado. Verificá tus permisos.</p>}

        {error && <p className="applications-message error">No se pudieron cargar las solicitudes.</p>}
        {!error && <p className="applications-count">{filtered.length} solicitudes encontradas</p>}

        <div className="applications-list">
          {filtered.map((application) => (
            <article className="application-card" key={application.id}>
              <header>
                <div><h2>{text(application.apellido_nombres)}</h2><p>{text(application.razon_social)}</p></div>
                <span className={`application-status ${application.estado}`}>{STATUS_LABELS[application.estado] || application.estado}</span>
              </header>
              <div className="application-summary">
                <span><b>Documento</b>{[application.tipo_documento, application.numero_documento].filter(Boolean).join(" ") || "—"}</span>
                <span><b>Fecha</b>{formatDate(application.creado_en)}</span>
              </div>
              <details>
                <summary>Abrir datos</summary>
                <dl>
                  <div><dt>CUIL</dt><dd>{text(application.cuil)}</dd></div>
                  <div><dt>Teléfono</dt><dd>{text(application.telefono)}</dd></div>
                  <div><dt>Correo</dt><dd>{text(application.correo)}</dd></div>
                  <div><dt>Estado</dt><dd>{STATUS_LABELS[application.estado] || application.estado}</dd></div>
                </dl>
                {isAdmin && (
                  <form className="application-status-form" action={updateApplicationStatus}>
                    <input type="hidden" name="id" value={application.id} />
                    <label htmlFor={`estado-${application.id}`}>Cambiar estado</label>
                    <div>
                      <select id={`estado-${application.id}`} name="estado" defaultValue={application.estado}>
                        {VALID_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
                      </select>
                      <button type="submit">Guardar estado</button>
                    </div>
                  </form>
                )}
              </details>
            </article>
          ))}
        </div>

        {!error && filtered.length === 0 && <div className="applications-empty"><h2>No hay solicitudes</h2><p>Probá otra búsqueda o creá una nueva ficha.</p></div>}
      </section>

      <style>{`
        .applications-page{width:100%;max-width:1450px}.applications-search{margin:22px 0;padding:20px;border:1px solid var(--linea);border-radius:12px;background:white}.applications-search label{display:block;margin-bottom:9px;font-weight:800;color:var(--petroleo)}.applications-search>div{display:flex;gap:10px}.applications-search input{flex:1;min-width:0;padding:13px;border:1px solid #aebfc4;border-radius:8px;font-size:16px}.applications-search button{padding:12px 22px;border:0;border-radius:8px;background:var(--petroleo);color:white;font-weight:800}.applications-count{font-size:15px;font-weight:800}.applications-list{display:grid;gap:14px;margin-top:15px}.application-card{padding:19px;border:1px solid var(--linea);border-radius:12px;background:white}.application-card>header{display:flex;justify-content:space-between;align-items:flex-start;gap:15px}.application-card h2{margin:0;color:var(--petroleo);font:700 20px Georgia,serif}.application-card header p{margin:5px 0 0;color:var(--gris);font-size:15px}.application-status{padding:7px 10px;border-radius:999px;background:#fff0c9;color:#6e4c00;font-size:12px;font-weight:900;text-transform:uppercase}.application-status.aprobada{background:#dff3e9;color:#145943}.application-status.rechazada{background:#fbe3df;color:#812f24}.application-summary{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:17px 0}.application-summary span{display:grid;gap:4px;font-size:15px}.application-summary b{font-size:12px;text-transform:uppercase;color:var(--gris)}.application-card summary{cursor:pointer;color:var(--petroleo);font-weight:900}.application-card dl{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:15px 0 0;padding-top:15px;border-top:1px solid var(--linea)}.application-card dl div{display:grid;gap:3px}.application-card dt{font-size:12px;font-weight:900;text-transform:uppercase;color:var(--gris)}.application-card dd{margin:0;font-size:15px}.applications-empty,.applications-message{padding:22px;border:1px solid var(--linea);border-radius:12px;background:white}.applications-message.error{border-color:#b45f52;background:#fff0ed;color:#812f24}:root[data-theme="dark"] .applications-search,:root[data-theme="dark"] .application-card,:root[data-theme="dark"] .applications-empty{background:#18343e;border-color:#49636c}:root[data-theme="dark"] .applications-search label,:root[data-theme="dark"] .application-card h2,:root[data-theme="dark"] .application-card summary{color:#f2f7f8}:root[data-theme="dark"] .applications-search input{background:#0b222a;border-color:#5f7b84;color:#f5f8f9}:root[data-theme="dark"] .application-card dl{border-color:#49636c}:root[data-theme="dark"] .application-card dd,:root[data-theme="dark"] .applications-count{color:#e4eef0}@media(max-width:700px){.applications-search>div{display:grid}.applications-search button{min-height:46px}.application-card>header{display:grid}.application-summary,.application-card dl{grid-template-columns:1fr}.application-status{width:fit-content}}
      `}</style>
      <style>{`
        .applications-message.success{border-color:#3c806b;background:#e6f5ef;color:#124f3e}
        .application-status-form{margin-top:17px;padding-top:15px;border-top:1px solid var(--linea)}
        .application-status-form label{display:block;margin-bottom:8px;font-weight:900}
        .application-status-form>div{display:flex;gap:10px}
        .application-status-form select{flex:1;min-width:0;padding:11px;border:1px solid #aebfc4;border-radius:8px;background:white;color:#173b49;font-size:15px}
        .application-status-form button{padding:11px 15px;border:0;border-radius:8px;background:#0b5264;color:white;font-weight:800}
        :root[data-theme="dark"] .application-status-form{border-color:#49636c}
        :root[data-theme="dark"] .application-status-form label{color:#f2f7f8}
        :root[data-theme="dark"] .application-status-form select{background:#0b222a;border-color:#5f7b84;color:#f5f8f9}
        :root[data-theme="dark"] .applications-message.success{border-color:#5c9e89;background:#173b32;color:#c6f3e1}
        @media(max-width:700px){.application-status-form>div{display:grid}.application-status-form button{min-height:46px}}
      `}</style>
    </main>
  );
}
