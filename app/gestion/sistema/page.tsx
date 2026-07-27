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
    String(profile.estado).toLowerCase() !==
      "aprobado"
  ) {
    redirect("/acceso");
  }

  const isAdmin =
    String(profile.rol).toLowerCase() ===
    "administrador";

  const { data: assignedPermissions } = isAdmin
    ? { data: [] }
    : await supabase
        .from("usuarios_permisos_sistema")
        .select("modulo_clave")
        .eq("usuario_id", user.id)
        .eq("habilitado", true)
        .eq("puede_consultar", true)
        .neq("alcance", "ninguno");

  const permissionKeys = new Set(
    (assignedPermissions || []).map((item) =>
      String(item.modulo_clave).toLowerCase(),
    ),
  );

  const canAccessModule = (...keys: string[]) =>
    isAdmin ||
    keys.some((key) =>
      permissionKeys.has(key.toLowerCase()),
    );

  if (!isAdmin && permissionKeys.size === 0) {
    redirect("/gestion");
  }

  const name = [
    profile.nombre,
    profile.apellido,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="management">
      <aside className="side">
        <Link
          className="side-brand"
          href="/gestion"
        >
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
            {isAdmin
              ? "● ACCESO ADMINISTRATIVO"
              : "● ACCESO AUTORIZADO"}
          </span>
        </header>

        <div className="cards">
          {canAccessModule("afiliados", "padron") && <Link
            className="module module-link"
            href="/gestion/sistema/afiliados"
          >
            <span>◎</span>

            <h2>Afiliados</h2>

            <p>
              Consulta del padrón, actualización de
              datos, estados, familiares y
              comunicaciones.
            </p>

            <small>INGRESAR</small>
          </Link>}

          {canAccessModule("beneficios") && <Link
            className="module module-link"
            href="/gestion/sistema/beneficios"
          >
            <span>◇</span>

            <h2>Beneficios</h2>

            <p>
              Administración de beneficios, lugares de
              entrega e historial de entregas a
              afiliados.
            </p>

            <small>INGRESAR</small>
          </Link>}

          {canAccessModule("reportes") && <Link
            className="module module-link"
            href="/gestion/sistema/reportes"
          >
            <span>▥</span>

            <h2>Reportes</h2>

            <p>
              Generación de listados institucionales
              del padrón y de las empresas.
            </p>

            <small>INGRESAR</small>
          </Link>}

          {canAccessModule("empresas") && <Link
            className="module module-link"
            href="/gestion/sistema/empresas"
          >
            <span>▣</span>

            <h2>Empresas</h2>

            <p>
              Alta, edición, activación y
              administración de empresas y sus datos
              institucionales.
            </p>

            <small>INGRESAR</small>
          </Link>}

          {canAccessModule("configuracion", "configuración") && <Link
            className="module module-link"
            href="/gestion/sistema/configuracion"
          >
            <span>⚙</span>

            <h2>Configuración</h2>

            <p>
              Provincias, departamentos, estados del
              afiliado y futuras configuraciones del
              sistema.
            </p>

            <small>INGRESAR</small>
          </Link>}

          {isAdmin && <Link
            className="module module-link"
            href="/gestion/sistema/permisos"
          >
            <span>🔐</span>

            <h2>Permisos de acceso</h2>

            <p>
              Habilitación de módulos, acciones y alcance
              de consulta para cada persona autorizada.
            </p>

            <small>ADMINISTRAR</small>
          </Link>}
        </div>
      </section>
    </main>
  );
}
