import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";

export default async function SistemaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/acceso");
  }

  const { data: profile } = await supabase
    .from("usuarios")
    .select("nombre,apellido,rol,estado,activo")
    .eq("id", user.id)
    .maybeSingle();

  if (
    !profile ||
    profile.activo === false ||
    String(profile.estado).toLowerCase() !== "aprobado"
  ) {
    redirect("/acceso");
  }

  const isAdmin =
    String(profile.rol).toLowerCase() === "administrador";

  if (!isAdmin) {
    redirect("/gestion");
  }

  const name = [profile.nombre, profile.apellido]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="management">
      <aside className="side">
        <Link className="side-brand" href="/gestion">
          <Image
            src="/logo-aoma.png"
            width={39}
            height={39}
            alt="AOMA"
          />

          <div>
            <strong>SIGCA</strong>
            <span>SECCIONAL SAN JUAN</span>
          </div>
        </Link>

        <nav>
          <Link href="/gestion">
            Inicio institucional
          </Link>

          <Link href="/gestion/sindical">
            Gestión sindical
          </Link>

          <Link href="/gestion/formacion">
            Formación Sindical
          </Link>

          <Link href="/gestion/biblioteca">
            Biblioteca
          </Link>

          <Link
            className="active"
            href="/gestion/sistema"
          >
            Sistema
          </Link>

          <Link href="/gestion/perfil">
            Mi perfil
          </Link>

          <Link href="/gestion/usuarios">
            Administración de usuarios
          </Link>
        </nav>

        <div className="session">
          <strong>{name}</strong>
          <span>Administrador</span>
          <SignOutButton />
        </div>
      </aside>

      <section className="main-area">
        <header className="main-head">
          <div>
            <p className="kicker">
              ADMINISTRACIÓN INSTITUCIONAL
            </p>

            <h1>Sistema</h1>

            <p>
              Administración del padrón, beneficios,
              empresas, reportes y parámetros
              institucionales.
            </p>
          </div>

          <span className="secure">
            ● ACCESO ADMINISTRATIVO
          </span>
        </header>

        <div className="cards">
          <Link
  className="module module-link"
  href="/gestion/sistema/empresas"
>
  <span>▣</span>

  <h2>Empresas</h2>

  <p>
    Alta, edición, activación y administración
    de empresas y sus datos institucionales.
  </p>

  <small>INGRESAR</small>
</Link>

          <article className="module">
            <span>◇</span>

            <h2>Beneficios</h2>

            <p>
              Administración de beneficios y registro de
              entregas a afiliados.
            </p>

            <small>EN PREPARACIÓN</small>
          </article>

          <article className="module">
            <span>▥</span>

            <h2>Reportes</h2>

            <p>
              Información general del padrón, correos
              electrónicos y empresas.
            </p>

            <small>EN PREPARACIÓN</small>
          </article>

          <article className="module">
            <span>▣</span>

            <h2>Empresas</h2>

            <p>
              Alta, edición, activación y administración
              de empresas y sus datos institucionales.
            </p>

            <small>EN PREPARACIÓN</small>
          </article>

          <article className="module">
            <span>⚙</span>

            <h2>Configuración</h2>

            <p>
              Provincias, departamentos, estados del
              afiliado y futuras configuraciones.
            </p>

            <small>EN PREPARACIÓN</small>
          </article>
        </div>
      </section>
    </main>
  );
}
