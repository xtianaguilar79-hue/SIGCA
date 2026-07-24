import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";

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
      </section>
    </main>
  );
}
