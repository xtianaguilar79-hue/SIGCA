import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";

export default async function ManagementPage() {
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

  const name = [profile.nombre, profile.apellido]
    .filter(Boolean)
    .join(" ");

  const isAdmin =
    String(profile.rol).toLowerCase() ===
    "administrador";

  const { data: systemPermissions } = isAdmin
    ? { data: [] }
    : await supabase
        .from("usuarios_permisos_sistema")
        .select("modulo_clave")
        .eq("usuario_id", user.id)
        .eq("habilitado", true)
        .eq("puede_consultar", true);

  const canAccessSystem =
    isAdmin || (systemPermissions?.length || 0) > 0;

  return (
    <main className="management">
      <aside className="side">
        <div className="side-brand">
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
        </div>

        <nav>
          <Link
            className="active"
            href="/gestion"
            prefetch={false}
          >
            Inicio institucional
          </Link>

          <a href="#">Afiliaciones</a>
          <a href="#">Gestión sindical</a>

          <Link href="/gestion/formacion">
            Formación Sindical
          </Link>

          <Link href="/gestion/biblioteca">
            Biblioteca
          </Link>

          {canAccessSystem && (
            <Link href="/gestion/sistema">
              Sistema
            </Link>
          )}

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
              profile.rol || "Usuario autorizado",
            )}
          </span>
          <SignOutButton />
        </div>
      </aside>

      <section className="main-area">
        <header className="main-head">
          <div>
            <p className="kicker">
              GESTIÓN INSTITUCIONAL
            </p>

            <h1>Buen día, {profile.nombre}</h1>

            <p>
              Tu espacio de trabajo sindical está
              protegido y listo.
            </p>
          </div>

          <span className="secure">
            ● SESIÓN SEGURA
          </span>
        </header>

        <div className="cards">
          <Link
  className="module module-link"
  href="/gestion/sindical"
>
  <span>◇</span>
  <h2>Gestión sindical</h2>
  <p>
    Afiliaciones, actas, visitas, reclamos,
    compromisos y expedientes relacionados.
  </p>
  <small>ABRIR GESTIÓN SINDICAL</small>
</Link>

          <Link
            className="module module-link"
            href="/gestion/formacion"
          >
            <span>◫</span>
            <h2>Formación Sindical</h2>
            <p>
              Formación para dirigentes y delegados
              con contenidos, actividades y
              certificación.
            </p>
            <small>
              {isAdmin
                ? "CONTENIDO EN REVISIÓN"
                : "CONTENIDO EN DESARROLLO"}
            </small>
          </Link>

          <Link
            className="module module-link"
            href="/gestion/biblioteca"
          >
            <span>▥</span>
            <h2>Biblioteca</h2>
            <p>
              Consultá leyes y convenios colectivos
              mediante un buscador sencillo y
              navegable.
            </p>
            <small>
              5 LEYES · 7 CONVENIOS
            </small>
          </Link>

          <Link
            className="module module-link"
            href="/gestion/perfil"
          >
            <span>◉</span>
            <h2>Mi perfil</h2>
            <p>
              Consultá tus datos personales e
              institucionales y actualizá tu
              información de contacto.
            </p>
            <small>DISPONIBLE</small>
          </Link>

          {canAccessSystem && (
            <Link
              className="module module-link"
              href="/gestion/sistema"
            >
              <span>⚙</span>
              <h2>Sistema</h2>
              <p>
                Administrá el padrón, beneficios,
                empresas, reportes, configuraciones y
                permisos de acceso.
              </p>
              <small>ACCESO ADMINISTRATIVO</small>
            </Link>
          )}

          {isAdmin && (
            <Link
              className="module module-link"
              href="/gestion/usuarios"
            >
              <span>◎</span>
              <h2>Administración de usuarios</h2>
              <p>
                Revisá solicitudes, asigná funciones
                y administrá los accesos
                institucionales.
              </p>
              <small>DISPONIBLE</small>
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
