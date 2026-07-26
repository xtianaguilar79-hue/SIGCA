import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";

export default async function ConfiguracionPage() {
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
          <Link href="/gestion">Inicio institucional</Link>
          <Link href="/gestion/sindical">Gestión sindical</Link>
          <Link href="/gestion/formacion">Formación Sindical</Link>
          <Link href="/gestion/biblioteca">Biblioteca</Link>
          <Link href="/gestion/perfil">Mi perfil</Link>
          <Link className="active" href="/gestion/sistema">
            Sistema
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
        <Link
          className="library-back"
          href="/gestion/sistema"
        >
          ← Volver a Sistema
        </Link>

        <header className="main-head">
          <div>
            <p className="kicker">
              SISTEMA · CONFIGURACIÓN
            </p>
            <h1>Configuración</h1>
            <p>
              Catálogos y parámetros institucionales
              utilizados por el padrón y los formularios.
            </p>
          </div>
          <span className="secure">
            ● ACCESO ADMINISTRATIVO
          </span>
        </header>

        <div className="cards">
          <Link
            className="module module-link"
            href="/gestion/sistema/configuracion/estados-afiliatorios"
          >
            <span>◎</span>
            <h2>Estados afiliatorios</h2>
            <p>
              Orden, descripción y disponibilidad de las
              situaciones utilizadas en el padrón.
            </p>
            <small>INGRESAR</small>
          </Link>

          <Link
            className="module module-link"
            href="/gestion/sistema/configuracion/provincias"
          >
            <span>◇</span>
            <h2>Provincias</h2>
            <p>
              Catálogo oficial de provincias para
              domicilios, afiliados y empresas.
            </p>
            <small>INGRESAR</small>
          </Link>

          <Link
            className="module module-link"
            href="/gestion/sistema/configuracion/departamentos"
          >
            <span>⌖</span>
            <h2>Departamentos</h2>
            <p>
              Departamentos y localidades relacionados
              con cada provincia.
            </p>
            <small>INGRESAR</small>
          </Link>
        </div>
      </section>
    </main>
  );
}
