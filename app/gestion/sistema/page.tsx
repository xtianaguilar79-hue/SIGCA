import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";

type PermisoSistema = {
  modulo_clave: string | null;
  habilitado: boolean | null;
  puede_consultar: boolean | null;
  puede_crear: boolean | null;
  puede_editar: boolean | null;
  puede_aprobar: boolean | null;
  puede_configurar: boolean | null;
};

function permisoUtilizable(permiso: PermisoSistema) {
  return (
    permiso.habilitado === true &&
    (
      permiso.puede_consultar === true ||
      permiso.puede_crear === true ||
      permiso.puede_editar === true ||
      permiso.puede_aprobar === true ||
      permiso.puede_configurar === true
    )
  );
}

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

  let assignedPermissions: PermisoSistema[] = [];

  if (!isAdmin) {
    const { data: permissions, error: permissionsError } =
      await supabase
        .from("usuarios_permisos_sistema")
        .select(
          [
            "modulo_clave",
            "habilitado",
            "puede_consultar",
            "puede_crear",
            "puede_editar",
            "puede_aprobar",
            "puede_configurar",
          ].join(","),
        )
        .eq("usuario_id", user.id)
        .eq("habilitado", true);

    if (permissionsError) {
      console.error(
        "No se pudieron consultar los permisos del sistema:",
        permissionsError.message,
      );
    }

    assignedPermissions =
      (permissions || []) as unknown as PermisoSistema[];
  }

  const permissionKeys = new Set(
    assignedPermissions
      .filter(permisoUtilizable)
      .map((permission) =>
        String(permission.modulo_clave || "")
          .trim()
          .toLowerCase(),
      )
      .filter(Boolean),
  );

  if (!isAdmin && permissionKeys.size === 0) {
    redirect("/gestion");
  }

  const name = [profile.nombre, profile.apellido]
    .filter(Boolean)
    .join(" ");

  const canSeeAffiliates =
    isAdmin || permissionKeys.has("afiliados");

  const canSeeBenefits =
    isAdmin || permissionKeys.has("beneficios");

  const canSeeReports =
    isAdmin || permissionKeys.has("reportes");

  const canSeeCompanies =
    isAdmin || permissionKeys.has("empresas");

  const canSeeConfiguration =
    isAdmin || permissionKeys.has("configuracion");

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
            {isAdmin
              ? "Administrador"
              : String(profile.rol || "Usuario autorizado")}
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
              Administración del padrón, beneficios,
              empresas, reportes y parámetros
              institucionales.
            </p>
          </div>

          <span className="secure">
            ● ACCESO AUTORIZADO
          </span>
        </header>

        <div className="cards">
          {canSeeAffiliates && (
            <Link
              className="module module-link"
              href="/gestion/sistema/afiliados"
            >
              <span>◎</span>

              <h2>Afiliados</h2>

              <p>
                Consulta del padrón, actualización de datos,
                estados, familiares y comunicaciones.
              </p>

              <small>INGRESAR</small>
            </Link>
          )}

          {canSeeBenefits && (
            <Link
              className="module module-link"
              href="/gestion/sistema/beneficios"
            >
              <span>◇</span>

              <h2>Beneficios</h2>

              <p>
                Administración de beneficios, lugares de
                entrega e historial de movimientos.
              </p>

              <small>INGRESAR</small>
            </Link>
          )}

          {canSeeReports && (
            <Link
              className="module module-link"
              href="/gestion/sistema/reportes"
            >
              <span>▥</span>

              <h2>Reportes</h2>

              <p>
                Generación de reportes del padrón y de las
                empresas en CSV y PDF.
              </p>

              <small>INGRESAR</small>
            </Link>
          )}

          {canSeeCompanies && (
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
          )}

          {canSeeConfiguration && (
            <Link
              className="module module-link"
              href="/gestion/sistema/configuracion"
            >
              <span>⚙</span>

              <h2>Configuración</h2>

              <p>
                Provincias, departamentos, localidades,
                estados afiliatorios y parámetros del sistema.
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

              <h2>Permisos del sistema</h2>

              <p>
                Habilitá módulos y acciones específicas para
                cada usuario institucional.
              </p>

              <small>ADMINISTRAR</small>
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
