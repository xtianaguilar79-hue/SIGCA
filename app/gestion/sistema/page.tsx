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

  let assignedPermissions: {
    modulo_clave: string | null;
  }[] = [];

  if (!isAdmin) {
    const { data: permissions } = await supabase
      .from("usuarios_permisos_sistema")
      .select("modulo_clave")
      .eq("usuario_id", user.id)
      .eq("habilitado", true)
      .eq("puede_consultar", true);

    assignedPermissions = permissions || [];
  }

  const permissionKeys = new Set(
    assignedPermissions
      .map((permission) =>
        String(permission.modulo_clave || "")
          .trim()
          .toLowerCase(),
      )
      .filter(Boolean),
  );

  const canAccessAffiliates =
    isAdmin ||
    permissionKeys.has("afiliados") ||
    permissionKeys.has("padron");

  const canAccessBenefits =
    isAdmin || permissionKeys.has("beneficios");

  const canAccessReports =
    isAdmin || permissionKeys.has("reportes");

  const canAccessCompanies =
    isAdmin || permissionKeys.has("empresas");

  const canAccessConfiguration =
    isAdmin || permissionKeys.has("configuracion");

  const canAccessSystem =
    canAccessAffiliates ||
    canAccessBenefits ||
    canAccessReports ||
    canAccessCompanies ||
    canAccessConfiguration;

  if (!canAccessSystem) {
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

          <Link className="active" href="/gestion/sistema">
            Sistema
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
            {String(profile.rol || "Usuario autorizado")}
          </span>

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
              Acceso a las herramientas institucionales
              habilitadas para tu función.
            </p>
          </div>

          <span className="secure">
            ● ACCESO AUTORIZADO
          </span>
        </header>

        <div className="cards">
          {canAccessAffiliates && (
            <Link
              className="module module-link"
              href="/gestion/sistema/afiliados"
            >
              <span>◎</span>

              <h2>Afiliados</h2>

              <p>
                Consulta del padrón, información personal,
                empresas, estados y grupo familiar.
              </p>

              <small>INGRESAR</small>
            </Link>
          )}

          {canAccessBenefits && (
            <Link
              className="module module-link"
              href="/gestion/sistema/beneficios"
            >
              <span>◇</span>

              <h2>Beneficios</h2>

              <p>
                Administración de beneficios y registro
                de entregas a afiliados y familiares.
              </p>

              <small>INGRESAR</small>
            </Link>
          )}

          {canAccessReports && (
            <Link
              className="module module-link"
              href="/gestion/sistema/reportes"
            >
              <span>▥</span>

              <h2>Reportes</h2>

              <p>
                Información general del padrón,
                empresas y datos institucionales.
              </p>

              <small>INGRESAR</small>
            </Link>
          )}

          {canAccessCompanies && (
            <Link
              className="module module-link"
              href="/gestion/sistema/empresas"
            >
              <span>▣</span>

              <h2>Empresas</h2>

              <p>
                Alta, edición, activación y administración
                de empresas.
              </p>

              <small>INGRESAR</small>
            </Link>
          )}

          {canAccessConfiguration && (
            <Link
              className="module module-link"
              href="/gestion/sistema/configuracion"
            >
              <span>⚙</span>

              <h2>Configuración</h2>

              <p>
                Provincias, departamentos, localidades,
                estados y parámetros institucionales.
              </p>

              <small>INGRESAR</small>
            </Link>
          )}
          {isAdmin && (
  <Link
    className="module module-link"
    href="/gestion/sistema/permisos"
  >
    <span>🔐</span>
    <h2>Administrar permisos del sistema</h2>
    <p>
      Habilitá los módulos y las funciones disponibles para cada usuario.
    </p>
    <small>ADMINISTRAR PERMISOS</small>
  </Link>
)}
        </div>
      </section>
    </main>
  );
}
