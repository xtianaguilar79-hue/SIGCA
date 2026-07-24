import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";

const etiquetas: Record<string, string> = {
  nombre: "Nombre",
  razon_social: "Razón social",
  activa: "Estado",
  rama: "Rama",
  domicilio: "Domicilio",
  localidad: "Localidad",
  provincia: "Provincia",
  codigo_postal: "Código postal",
  cuit: "CUIT",
  correo_electronico: "Correo electrónico",
  email: "Correo electrónico",
  telefono: "Teléfono",
  cantidad_afiliados_activos_original: "Afiliados activos según registro original",
  notas: "Notas",
};

function mostrarValor(campo: string, valor: unknown) {
  if (campo === "activa") return valor === true ? "Activa" : "Inactiva";
  if (valor === null || valor === undefined || valor === "") return "Sin informar";
  return String(valor);
}

export default async function EmpresaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/acceso");

  const { data: profile } = await supabase
    .from("usuarios")
    .select("nombre,apellido,rol,estado,activo")
    .eq("id", user.id)
    .maybeSingle();

  if (
    !profile ||
    profile.activo === false ||
    String(profile.estado).toLowerCase() !== "aprobado" ||
    String(profile.rol).toLowerCase() !== "administrador"
  ) {
    redirect("/gestion");
  }

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const { data: empresa } = await supabase
    .from("empresas")
    .select(
      "id,nombre,razon_social,activa,rama,domicilio,localidad,provincia,codigo_postal,cuit,correo_electronico,email,telefono,cantidad_afiliados_activos_original,notas",
    )
    .eq("id", id)
    .maybeSingle();

  if (!empresa) notFound();

  const { data: historial } = await supabase
    .from("empresas_historial_cambios")
    .select(
      "id,accion,datos_anteriores,datos_nuevos,modificado_por,modificado_at",
    )
    .eq("empresa_id", id)
    .order("modificado_at", { ascending: false })
    .limit(50);

  const responsablesIds = [
    ...new Set(
      (historial || [])
        .map((item) => item.modificado_por)
        .filter(Boolean),
    ),
  ];

  const { data: responsables } = responsablesIds.length
    ? await supabase
        .from("usuarios")
        .select("id,nombre,apellido,mail")
        .in("id", responsablesIds)
    : { data: [] };

  const responsablesPorId = new Map(
    (responsables || []).map((responsable) => [
      responsable.id,
      [responsable.nombre, responsable.apellido]
        .filter(Boolean)
        .join(" ") ||
        responsable.mail ||
        "Usuario institucional",
    ]),
  );

  const nombreUsuario = [profile.nombre, profile.apellido]
    .filter(Boolean)
    .join(" ");

  const correo =
    empresa.correo_electronico || empresa.email || "Sin informar";

  return (
    <main className="management">
      <aside className="side">
        <Link className="side-brand" href="/gestion">
          <Image src="/logo-aoma.png" width={39} height={39} alt="AOMA" />
          <div>
            <strong>SIGCA</strong>
            <span>SECCIONAL SAN JUAN</span>
          </div>
        </Link>

        <nav>
          <Link href="/gestion">Inicio institucional</Link>
          <Link href="/gestion/sindical">Gestión sindical</Link>
          <Link href="/gestion/formacion">Formación Sindical</Link>
          <Link href="/gestion/biblioteca">Biblioteca</Link>
          <Link href="/gestion/perfil">Mi perfil</Link>
          <Link className="active" href="/gestion/sistema">Sistema</Link>
          <Link href="/gestion/usuarios">Administración de usuarios</Link>
        </nav>

        <div className="session">
          <strong>{nombreUsuario}</strong>
          <span>Administrador</span>
          <SignOutButton />
        </div>
      </aside>

      <section className="main-area companies-page">
        <Link className="library-back" href="/gestion/sistema/empresas">
          ← Volver a Empresas
        </Link>

        <header className="main-head">
          <div>
            <p className="kicker">SISTEMA · EMPRESAS</p>
            <h1>{empresa.nombre}</h1>
            <p>{empresa.razon_social || "Razón social sin informar"}</p>
          </div>
          <span
            className={
              empresa.activa
                ? "company-state active"
                : "company-state inactive"
            }
          >
            {empresa.activa ? "ACTIVA" : "INACTIVA"}
          </span>
        </header>

        <article className="company-detail-card">
          <h2>Datos institucionales</h2>
          <dl>
            <div><dt>Nombre</dt><dd>{empresa.nombre}</dd></div>
            <div><dt>Razón social</dt><dd>{empresa.razon_social || "Sin informar"}</dd></div>
            <div><dt>CUIT</dt><dd>{empresa.cuit || "Sin informar"}</dd></div>
            <div><dt>Rama</dt><dd>{empresa.rama || "Sin informar"}</dd></div>
            <div><dt>Domicilio</dt><dd>{empresa.domicilio || "Sin informar"}</dd></div>
            <div><dt>Localidad</dt><dd>{empresa.localidad || "Sin informar"}</dd></div>
            <div><dt>Provincia</dt><dd>{empresa.provincia || "Sin informar"}</dd></div>
            <div><dt>Código postal</dt><dd>{empresa.codigo_postal || "Sin informar"}</dd></div>
            <div><dt>Teléfono</dt><dd>{empresa.telefono || "Sin informar"}</dd></div>
            <div><dt>Correo electrónico</dt><dd>{correo}</dd></div>
            <div>
              <dt>Afiliados activos según registro original</dt>
              <dd>{empresa.cantidad_afiliados_activos_original ?? "Sin informar"}</dd>
            </div>
            <div className="company-detail-wide">
              <dt>Notas</dt>
              <dd>{empresa.notas || "Sin observaciones"}</dd>
            </div>
          </dl>

          <div className="company-detail-actions">
            <Link href={`/gestion/sistema/empresas/${empresa.id}/editar`}>
              Editar empresa
            </Link>
          </div>
        </article>

        <section className="company-history">
          <div className="company-history-heading">
            <div>
              <p className="kicker">MEMORIA INSTITUCIONAL</p>
              <h2>Historial de modificaciones</h2>
            </div>
            <span>{historial?.length || 0} REGISTROS</span>
          </div>

          {historial?.length ? (
            <div className="company-history-list">
              {historial.map((registro) => {
                const anteriores =
                  (registro.datos_anteriores as Record<string, unknown>) || {};
                const nuevos =
                  (registro.datos_nuevos as Record<string, unknown>) || {};

                const camposCambiados = Object.keys(etiquetas).filter(
                  (campo) =>
                    JSON.stringify(anteriores[campo]) !==
                    JSON.stringify(nuevos[campo]),
                );

                return (
                  <article className="company-history-item" key={registro.id}>
                    <header>
                      <div>
                        <strong>
                          {String(registro.accion).toLowerCase() === "insert"
                            ? "Empresa incorporada"
                            : "Datos actualizados"}
                        </strong>
                        <span>
                          {new Intl.DateTimeFormat("es-AR", {
                            dateStyle: "long",
                            timeStyle: "short",
                            timeZone: "America/Argentina/Buenos_Aires",
                          }).format(new Date(registro.modificado_at))}
                        </span>
                      </div>
                      <p>
                        Responsable:{" "}
                        {responsablesPorId.get(registro.modificado_por) ||
                          "Proceso institucional"}
                      </p>
                    </header>

                    {camposCambiados.length > 0 ? (
                      <dl>
                        {camposCambiados.map((campo) => (
                          <div key={campo}>
                            <dt>{etiquetas[campo]}</dt>
                            <dd>
                              <span>{mostrarValor(campo, anteriores[campo])}</span>
                              <b aria-hidden="true">→</b>
                              <strong>{mostrarValor(campo, nuevos[campo])}</strong>
                            </dd>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <p className="company-history-empty-change">
                        Registro institucional sin diferencias visibles.
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-users">
              Esta empresa todavía no registra modificaciones posteriores.
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
