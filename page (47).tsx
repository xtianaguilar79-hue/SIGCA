import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";
import {
  cambiarEstadoBeneficio,
  crearBeneficio,
} from "./actions";

function mostrarFecha(valor: string | null) {
  if (!valor) return "Sin fecha definida";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(`${valor.slice(0, 10)}T12:00:00`));
}

export default async function BeneficiosPage({
  searchParams,
}: {
  searchParams: Promise<{
    creado?: string;
    actualizado?: string;
    error?: string;
  }>;
}) {
  const parametros = await searchParams;
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

  const esAdministrador =
    String(profile.rol).toLowerCase() === "administrador";

  const { data: permiso } = await supabase
    .from("usuarios_permisos_sistema")
    .select(
      "habilitado,puede_consultar,puede_crear,puede_editar,puede_aprobar,puede_configurar,alcance",
    )
    .eq("usuario_id", user.id)
    .eq("modulo_clave", "beneficios")
    .maybeSingle();

  const permisoActivo =
    permiso?.habilitado === true &&
    String(permiso?.alcance || "").toLowerCase() !==
      "ninguno";

  const puedeConsultar =
    esAdministrador ||
    (permisoActivo && permiso?.puede_consultar === true);

  const puedeCrear =
    esAdministrador ||
    (permisoActivo && permiso?.puede_crear === true);

  const puedeEditar =
    esAdministrador ||
    (permisoActivo && permiso?.puede_editar === true);

  const puedeAprobar =
    esAdministrador ||
    (permisoActivo && permiso?.puede_aprobar === true);

  const puedeConfigurar =
    esAdministrador ||
    (permisoActivo && permiso?.puede_configurar === true);

  const puedeIngresar =
    esAdministrador ||
    puedeConsultar ||
    puedeCrear ||
    puedeEditar ||
    puedeAprobar ||
    puedeConfigurar;

  if (!puedeIngresar) {
    redirect("/gestion/sistema");
  }

  const [beneficiosResult, lugaresResult] =
    await Promise.all([
      supabase
        .from("beneficios")
        .select(
          "id,nombre,descripcion,fecha_inicio,fecha_fin,stock,activo",
        )
        .order("activo", { ascending: false })
        .order("nombre", { ascending: true }),

      supabase
        .from("beneficios_lugares_entrega")
        .select("id,nombre,activo")
        .eq("activo", true)
        .order("nombre", { ascending: true }),
    ]);

  const beneficios = beneficiosResult.data || [];
  const lugares = lugaresResult.data || [];

  const totalActivos = beneficios.filter(
    (beneficio) => beneficio.activo,
  ).length;

  const nombreUsuario = [
    profile.nombre,
    profile.apellido,
  ]
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

          {esAdministrador && (
            <Link href="/gestion/usuarios">
              Administración de usuarios
            </Link>
          )}
        </nav>

        <div className="session">
          <strong>{nombreUsuario}</strong>
          <span>
            {String(
              profile.rol || "Usuario autorizado",
            )}
          </span>
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
              SISTEMA · ASISTENCIA INSTITUCIONAL
            </p>

            <h1>Beneficios</h1>

            <p>
              Administración del catálogo y registro de
              beneficios entregados a titulares y
              familiares.
            </p>
          </div>

          <span className="secure">
            ●{" "}
            {esAdministrador
              ? "ACCESO ADMINISTRATIVO"
              : "ACCESO AUTORIZADO"}
          </span>
        </header>

        {parametros.creado === "1" && (
          <div className="form-message success">
            El beneficio fue creado correctamente.
          </div>
        )}

        {parametros.actualizado === "1" && (
          <div className="form-message success">
            El estado del beneficio fue actualizado.
          </div>
        )}

        {parametros.error && (
          <div className="form-message error">
            No fue posible completar la operación.
          </div>
        )}

        <div className="admin-summary">
          <article>
            <strong>{beneficios.length}</strong>
            <span>Beneficios registrados</span>
          </article>

          <article>
            <strong>{totalActivos}</strong>
            <span>Beneficios activos</span>
          </article>

          <article>
            <strong>{lugares.length}</strong>
            <span>Lugares de entrega activos</span>
          </article>
        </div>

        <div className="benefits-main-actions">
          {puedeCrear && (
            <Link
              className="benefit-main-action primary"
              href="/gestion/sistema/beneficios/entregar"
            >
              <span>＋</span>
              <strong>Entregar un beneficio</strong>
              <small>
                Registrar una nueva entrega
              </small>
            </Link>
          )}

          {puedeConsultar && (
            <Link
              className="benefit-main-action"
              href="/gestion/sistema/beneficios/historial"
            >
              <span>▤</span>
              <strong>Historial de entregas</strong>
              <small>
                Consultar movimientos realizados
              </small>
            </Link>
          )}

          {puedeConfigurar && (
            <Link
              className="benefit-main-action"
              href="/gestion/sistema/beneficios/lugares"
            >
              <span>⌖</span>
              <strong>Administrar lugares</strong>
              <small>
                Configurar sedes de entrega
              </small>
            </Link>
          )}
        </div>

        {puedeCrear && (
          <details className="admin-create-panel">
            <summary>
              ＋ Crear nuevo beneficio
            </summary>

            <form
              action={crearBeneficio}
              className="admin-create-form"
            >
              <label>
                <span>Nombre</span>
                <input
                  name="nombre"
                  required
                  minLength={3}
                  placeholder="Ej.: Útiles escolares"
                />
              </label>

              <label>
                <span>Descripción</span>
                <textarea
                  name="descripcion"
                  rows={3}
                  placeholder="Descripción institucional"
                />
              </label>

              <label>
                <span>Fecha de inicio</span>
                <input
                  name="fecha_inicio"
                  type="date"
                />
              </label>

              <label>
                <span>Fecha de finalización</span>
                <input
                  name="fecha_fin"
                  type="date"
                />
              </label>

              <label>
                <span>Stock</span>
                <input
                  name="stock"
                  type="number"
                  min={0}
                  placeholder="Vacío: sin control de stock"
                />
              </label>

              <label className="consent-field">
                <input
                  name="activo"
                  type="checkbox"
                  defaultChecked
                />
                <span>Beneficio activo</span>
              </label>

              <button
                className="submit"
                type="submit"
              >
                Guardar beneficio
              </button>
            </form>
          </details>
        )}

        <section className="profile-card">
          <div className="profile-card-head">
            <div>
              <p className="kicker">
                CATÁLOGO INSTITUCIONAL
              </p>
              <h2>Beneficios registrados</h2>
              <p>
                Información vigente para la gestión de
                entregas.
              </p>
            </div>

            <span>{beneficios.length} beneficios</span>
          </div>

          <div className="benefit-catalog">
            {beneficios.map((beneficio) => (
              <article
                className="benefit-catalog-card"
                key={beneficio.id}
              >
                <header>
                  <div>
                    <h3>{beneficio.nombre}</h3>
                    <p>
                      {beneficio.descripcion ||
                        "Sin descripción institucional."}
                    </p>
                  </div>

                  <span
                    className={
                      beneficio.activo
                        ? "user-state aprobado"
                        : "user-state rechazado"
                    }
                  >
                    {beneficio.activo
                      ? "ACTIVO"
                      : "INACTIVO"}
                  </span>
                </header>

                <dl>
                  <div>
                    <dt>Vigencia</dt>
                    <dd>
                      {mostrarFecha(
                        beneficio.fecha_inicio,
                      )}
                      {" · "}
                      {mostrarFecha(
                        beneficio.fecha_fin,
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>Stock</dt>
                    <dd>
                      {beneficio.stock === null
                        ? "Sin control de stock"
                        : beneficio.stock}
                    </dd>
                  </div>
                </dl>

                {(puedeEditar || puedeConfigurar) && (
                  <form
                    action={cambiarEstadoBeneficio}
                  >
                    <input
                      type="hidden"
                      name="id"
                      value={beneficio.id}
                    />

                    <input
                      type="hidden"
                      name="activo"
                      value={String(
                        !beneficio.activo,
                      )}
                    />

                    <button
                      className={
                        beneficio.activo
                          ? "reject-user"
                          : "approve-user"
                      }
                      type="submit"
                    >
                      {beneficio.activo
                        ? "Desactivar beneficio"
                        : "Activar beneficio"}
                    </button>
                  </form>
                )}
              </article>
            ))}

            {beneficios.length === 0 && (
              <div className="empty-users">
                No hay beneficios registrados.
              </div>
            )}
          </div>
        </section>

        <section className="profile-card">
          <div className="profile-card-head">
            <div>
              <p className="kicker">
                LUGARES DISPONIBLES
              </p>
              <h2>Lugares de entrega activos</h2>
            </div>
          </div>

          <div className="benefit-location-list">
            {lugares.map((lugar) => (
              <span key={lugar.id}>
                {lugar.nombre}
              </span>
            ))}

            {lugares.length === 0 && (
              <p>
                No hay lugares de entrega activos.
              </p>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
