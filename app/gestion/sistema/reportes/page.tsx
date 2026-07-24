import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";

export default async function ReportesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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
  ) redirect("/gestion");

  const [
    { count: totalAfiliados },
    { count: totalEmpresas },
    { count: empresasActivas },
  ] = await Promise.all([
    supabase.from("afiliados").select("id", { count: "exact", head: true }),
    supabase.from("empresas").select("id", { count: "exact", head: true }),
    supabase
      .from("empresas")
      .select("id", { count: "exact", head: true })
      .eq("activa", true),
  ]);

  const name = [profile.nombre, profile.apellido].filter(Boolean).join(" ");

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
          <strong>{name}</strong>
          <span>Administrador</span>
          <SignOutButton />
        </div>
      </aside>

      <section className="main-area reports-page">
        <Link className="library-back" href="/gestion/sistema">
          ← Volver a Sistema
        </Link>

        <header className="main-head">
          <div>
            <p className="kicker">SISTEMA · INFORMACIÓN INSTITUCIONAL</p>
            <h1>Reportes</h1>
            <p>Consultas consolidadas del padrón de afiliados y las empresas.</p>
          </div>
          <span className="secure">● ACCESO ADMINISTRATIVO</span>
        </header>

        <div className="report-summary report-summary-two">
          <article>
            <span>PADRÓN</span>
            <strong>{(totalAfiliados || 0).toLocaleString("es-AR")}</strong>
            <p>Personas registradas</p>
          </article>
          <article>
            <span>EMPRESAS</span>
            <strong>{(totalEmpresas || 0).toLocaleString("es-AR")}</strong>
            <p>
              {(empresasActivas || 0).toLocaleString("es-AR")} activas ·{" "}
              {((totalEmpresas || 0) - (empresasActivas || 0)).toLocaleString("es-AR")} inactivas
            </p>
          </article>
        </div>

        <div className="cards">
          <Link className="module module-link" href="/gestion/sistema/reportes/afiliados">
            <span>◎</span>
            <h2>General de afiliados</h2>
            <p>Estado general del padrón, distribución por empresa y situación afiliatoria.</p>
            <small>INGRESAR</small>
          </Link>
          <Link className="module module-link" href="/gestion/sistema/reportes/empresas">
            <span>▣</span>
            <h2>Empresas</h2>
            <p>Información consolidada de empresas activas, históricas y padrón vinculado.</p>
            <small>INGRESAR</small>
          </Link>
        </div>
      </section>
    </main>
  );
}
