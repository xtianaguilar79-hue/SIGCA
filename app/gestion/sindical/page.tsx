import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";

export default async function GestionSindicalPage() {
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
    String(profile.estado).toLowerCase() !==
      "aprobado"
  ) {
    redirect("/acceso");
  }

  const name = [profile.nombre, profile.apellido]
    .filter(Boolean)
    .join(" ");

  const isAdmin =
    String(profile.rol).toLowerCase() ===
    "administrador";

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

          <Link
            className="active"
            href="/gestion/sindical"
          >
            Gestión sindical
          </Link>

          <Link href="/gestion/formacion">
            Formación Sindical
          </Link>

          <Link href="/gestion/biblioteca">
            Biblioteca
          </Link>

          <Link href="/gestion/perfil">
            Mi perfil
          </Link>

          {isAdmin && (
            <Link href="/gestion/usuarios">
              Administración de usuarios
            </Link>
          )}
        </nav>

        <div className="session">
          <strong>{name}</strong>

          <span>
            {String(
              profile.rol || "Usuario autorizado"
            )}
          </span>

          <SignOutButton />
        </div>
      </aside>

      <section className="main-area">
        <header className="main-head">
          <div>
            <p className="kicker">
              ORGANIZACIÓN Y SEGUIMIENTO
            </p>

            <h1>Gestión Sindical</h1>

            <p>
              Herramientas para organizar afiliaciones,
              reclamos, actas, visitas y compromisos.
            </p>
          </div>
        </header>

        <div className="cards">
          <Link
            className="module module-link"
            href="/gestion/sindical/afiliaciones"
          >
            <span>▤</span>

            <h2>Afiliaciones</h2>

            <p>
              Solicitudes, fichas oficiales, altas,
              bajas, traslados y seguimiento por
              empresa.
            </p>

            <small>INGRESAR</small>
          </Link>

          <article className="module">
            <span>▧</span>
            <h2>Actas y minutas</h2>
            <p>
              Registro de reuniones, decisiones,
              participantes y asuntos pendientes.
            </p>
            <small>EN PREPARACIÓN</small>
          </article>

          <article className="module">
            <span>!</span>
            <h2>Reclamos</h2>
            <p>
              Registro, documentación, responsables,
              estado y seguimiento de cada reclamo.
            </p>
            <small>EN PREPARACIÓN</small>
          </article>

          <article className="module">
            <span>⌖</span>
            <h2>Visitas e inspecciones</h2>
            <p>
              Constancias de recorridas, observaciones,
              hallazgos y acciones necesarias.
            </p>
            <small>EN PREPARACIÓN</small>
          </article>

          <article className="module">
            <span>✓</span>
            <h2>Compromisos</h2>
            <p>
              Acuerdos asumidos, responsables, plazos
              y comprobación de cumplimiento.
            </p>
            <small>EN PREPARACIÓN</small>
          </article>

          <article className="module">
            <span>▣</span>
            <h2>Expedientes</h2>
            <p>
              Documentación relacionada, antecedentes,
              actuaciones y memoria institucional.
            </p>
            <small>EN PREPARACIÓN</small>
          </article>
        </div>
      </section>
    </main>
  );
}
