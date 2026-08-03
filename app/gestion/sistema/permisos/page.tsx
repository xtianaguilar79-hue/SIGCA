import Image from "next/image";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";

const RUTA = "/gestion/sistema/permisos";

const ALCANCES_VALIDOS = [
  "ninguno",
  "completo",
  "empresa",
  "sede",
] as const;

const CAMPOS_PERMISO = [
  "puede_consultar",
  "puede_crear",
  "puede_editar",
  "puede_aprobar",
  "puede_configurar",
] as const;

type Alcance = (typeof ALCANCES_VALIDOS)[number];
type CampoPermiso = (typeof CAMPOS_PERMISO)[number];

type Permiso = {
  modulo_clave: string;
  habilitado: boolean | null;
  puede_consultar: boolean | null;
  puede_crear: boolean | null;
  puede_editar: boolean | null;
  puede_aprobar: boolean | null;
  puede_configurar: boolean | null;
  alcance: string | null;
  empresa_id: number | null;
  sede: string | null;
};

function obtenerBooleano(
  formData: FormData,
  campo: CampoPermiso,
) {
  return formData.get(campo) === "on";
}

async function guardarPermiso(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/acceso");
  }

  const { data: esAdministrador, error: errorAdministrador } =
    await supabase.rpc("sigca_es_administrador", {
      p_usuario_id: user.id,
    });

  if (errorAdministrador || esAdministrador !== true) {
    redirect("/gestion");
  }

  const usuarioId = String(
    formData.get("usuario_id") || "",
  ).trim();

  const moduloClave = String(
    formData.get("modulo_clave") || "",
  ).trim();

  if (!usuarioId || !moduloClave) {
    redirect(`${RUTA}?error=datos`);
  }

  const habilitado =
    formData.get("habilitado") === "on";

  const permisos = {
    puede_consultar: obtenerBooleano(
      formData,
      "puede_consultar",
    ),
    puede_crear: obtenerBooleano(
      formData,
      "puede_crear",
    ),
    puede_editar: obtenerBooleano(
      formData,
      "puede_editar",
    ),
    puede_aprobar: obtenerBooleano(
      formData,
      "puede_aprobar",
    ),
    puede_configurar: obtenerBooleano(
      formData,
      "puede_configurar",
    ),
  };

  const tieneAlgunaOperacion =
    permisos.puede_consultar ||
    permisos.puede_crear ||
    permisos.puede_editar ||
    permisos.puede_aprobar ||
    permisos.puede_configurar;

  let alcance = String(
    formData.get("alcance") || "ninguno",
  ).toLowerCase() as Alcance;

  if (!ALCANCES_VALIDOS.includes(alcance)) {
    alcance = "ninguno";
  }

  let empresaId: number | null = null;
  let sede: string | null = null;

  if (habilitado) {
    /*
     * Toda persona con operaciones habilitadas necesita
     * poder consultar el módulo para ingresar y ver datos.
     */
    if (tieneAlgunaOperacion) {
      permisos.puede_consultar = true;
    }

    /*
     * Evita permisos habilitados con alcance "ninguno",
     * que permitían entrar al módulo pero mostraban cero datos.
     */
    if (
      alcance === "ninguno" &&
      permisos.puede_consultar
    ) {
      alcance = "completo";
    }

    if (alcance === "empresa") {
      const valorEmpresa = Number(
        formData.get("empresa_id"),
      );

      if (
        !Number.isInteger(valorEmpresa) ||
        valorEmpresa <= 0
      ) {
        redirect(
          `${RUTA}?usuario=${encodeURIComponent(
            usuarioId,
          )}&error=empresa`,
        );
      }

      empresaId = valorEmpresa;
    }

    if (alcance === "sede") {
      sede =
        String(formData.get("sede") || "").trim() ||
        null;

      if (!sede) {
        redirect(
          `${RUTA}?usuario=${encodeURIComponent(
            usuarioId,
          )}&error=sede`,
        );
      }
    }
  } else {
    permisos.puede_consultar = false;
    permisos.puede_crear = false;
    permisos.puede_editar = false;
    permisos.puede_aprobar = false;
    permisos.puede_configurar = false;
    alcance = "ninguno";
  }

  const { error } = await supabase
    .from("usuarios_permisos_sistema")
    .upsert(
      {
        usuario_id: usuarioId,
        modulo_clave: moduloClave,
        habilitado,
        ...permisos,
        alcance,
        empresa_id: empresaId,
        sede,
        asignado_por: user.id,
        actualizado_en: new Date().toISOString(),
      },
      {
        onConflict: "usuario_id,modulo_clave",
      },
    );

  if (error) {
    console.error(
      "Error al guardar permisos de sistema:",
      error,
    );

    redirect(
      `${RUTA}?usuario=${encodeURIComponent(
        usuarioId,
      )}&error=guardado`,
    );
  }

  revalidatePath(RUTA);
  revalidatePath("/gestion");
  revalidatePath("/gestion/sistema");
  revalidatePath("/gestion/sistema/afiliados");
  revalidatePath("/gestion/sistema/beneficios");
  revalidatePath("/gestion/sistema/reportes");
  revalidatePath("/gestion/sistema/empresas");
  revalidatePath("/gestion/sistema/configuracion");

  redirect(
    `${RUTA}?usuario=${encodeURIComponent(
      usuarioId,
    )}&guardado=1`,
  );
}

export default async function PermisosSistemaPage({
  searchParams,
}: {
  searchParams: Promise<{
    usuario?: string;
    guardado?: string;
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

  const esAdministrador =
    profile &&
    profile.activo !== false &&
    String(profile.estado).toLowerCase() ===
      "aprobado" &&
    String(profile.rol).toLowerCase() ===
      "administrador";

  if (!esAdministrador) {
    redirect("/gestion");
  }

  const [
    usuariosResultado,
    modulosResultado,
    empresasResultado,
  ] = await Promise.all([
    supabase
      .from("usuarios")
      .select(
        "id,nombre,apellido,mail,rol,estado,activo",
      )
      .eq("estado", "Aprobado")
      .eq("activo", true)
      .order("apellido", { ascending: true })
      .order("nombre", { ascending: true }),

    supabase
      .from("sistema_modulos")
      .select("clave,nombre,descripcion,orden,activo")
      .eq("activo", true)
      .order("orden", { ascending: true }),

    supabase
      .from("empresas")
      .select("id,nombre,activa")
      .eq("activa", true)
      .order("nombre", { ascending: true }),
  ]);

  const usuarios = usuariosResultado.data || [];
  const modulos = modulosResultado.data || [];
  const empresas = empresasResultado.data || [];

  const usuarioSeleccionado =
    usuarios.find(
      (usuario) =>
        usuario.id === parametros.usuario,
    ) || null;

  let permisos: Permiso[] = [];

  if (usuarioSeleccionado) {
    const { data } = await supabase
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
          "alcance",
          "empresa_id",
          "sede",
        ].join(","),
      )
      .eq("usuario_id", usuarioSeleccionado.id);

    permisos = (data || []) as Permiso[];
  }

  const nombreAdministrador = [
    profile?.nombre,
    profile?.apellido,
  ]
    .filter(Boolean)
    .join(" ");

  const mensajesError: Record<string, string> = {
    datos:
      "No fue posible identificar el usuario o el módulo.",
    empresa:
      "Seleccioná una empresa para utilizar ese alcance.",
    sede:
      "Escribí la sede correspondiente para utilizar ese alcance.",
    guardado:
      "No fue posible guardar los permisos. Revisá la configuración e intentá nuevamente.",
  };

  return (
    <main className="management permissions-page">
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

          <Link href="/gestion/sistema">
            Sistema
          </Link>

          <Link href="/gestion/perfil">
            Mi perfil
          </Link>

          <Link
            className="active"
            href="/gestion/usuarios"
          >
            Administración de usuarios
          </Link>
        </nav>

        <div className="session">
          <strong>{nombreAdministrador}</strong>
          <span>Administrador</span>
          <SignOutButton />
        </div>
      </aside>

      <section className="main-area">
        <Link
          className="library-back"
          href="/gestion/usuarios"
        >
          ← Volver a Administración de usuarios
        </Link>

        <header className="main-head">
          <div>
            <p className="kicker">
              ADMINISTRACIÓN · SEGURIDAD
            </p>

            <h1>Permisos del sistema</h1>

            <p>
              Definí qué módulos puede utilizar cada
              persona y qué operaciones puede realizar.
            </p>
          </div>

          <span className="secure">
            ● ACCESO ADMINISTRATIVO
          </span>
        </header>

        {parametros.guardado === "1" && (
          <div
            className="form-message success"
            role="status"
          >
            Los permisos fueron guardados correctamente.
          </div>
        )}

        {parametros.error && (
          <div
            className="form-message error"
            role="alert"
          >
            {mensajesError[parametros.error] ||
              mensajesError.guardado}
          </div>
        )}

        <section className="permission-user-selector">
          <div>
            <p className="kicker">
              PERSONA AUTORIZADA
            </p>

            <h2>Seleccioná un usuario</h2>

            <p>
              Solo se muestran cuentas aprobadas y
              activas.
            </p>
          </div>

          <form method="get">
            <label>
              <span>Usuario</span>

              <select
                name="usuario"
                defaultValue={
                  usuarioSeleccionado?.id || ""
                }
                required
              >
                <option value="">
                  Seleccionar una persona
                </option>

                {usuarios.map((usuario) => (
                  <option
                    key={usuario.id}
                    value={usuario.id}
                  >
                    {[
                      usuario.apellido,
                      usuario.nombre,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                    {" · "}
                    {usuario.rol || "Sin función"}
                    {" · "}
                    {usuario.mail || "Sin correo"}
                  </option>
                ))}
              </select>
            </label>

            <button type="submit">
              Consultar permisos
            </button>
          </form>
        </section>

        {!usuarioSeleccionado && (
          <section className="permissions-empty">
            <strong>
              Seleccioná una persona para administrar sus
              permisos.
            </strong>

            <p>
              Los cambios se aplicarán únicamente al
              usuario elegido.
            </p>
          </section>
        )}

        {usuarioSeleccionado && (
          <>
            <section className="permission-user-summary">
              <div className="permission-user-avatar">
                {String(
                  usuarioSeleccionado.nombre || "U",
                )
                  .charAt(0)
                  .toUpperCase()}
                {String(
                  usuarioSeleccionado.apellido || "",
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <p className="kicker">
                  CONFIGURANDO PERMISOS
                </p>

                <h2>
                  {[
                    usuarioSeleccionado.nombre,
                    usuarioSeleccionado.apellido,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                </h2>

                <p>
                  {usuarioSeleccionado.mail ||
                    "Correo no informado"}
                  {" · "}
                  {usuarioSeleccionado.rol ||
                    "Sin función asignada"}
                </p>
              </div>
            </section>

            <div className="permissions-grid">
              {modulos.map((modulo) => {
                const permiso = permisos.find(
                  (registro) =>
                    registro.modulo_clave ===
                    modulo.clave,
                );

                return (
                  <article
                    className="permission-card"
                    key={modulo.clave}
                  >
                    <header>
                      <div>
                        <p className="kicker">
                          MÓDULO DEL SISTEMA
                        </p>

                        <h2>{modulo.nombre}</h2>

                        <p>
                          {modulo.descripcion ||
                            "Acceso institucional al módulo."}
                        </p>
                      </div>

                      <span
                        className={
                          permiso?.habilitado
                            ? "permission-state enabled"
                            : "permission-state disabled"
                        }
                      >
                        {permiso?.habilitado
                          ? "HABILITADO"
                          : "DESHABILITADO"}
                      </span>
                    </header>

                    <form action={guardarPermiso}>
                      <input
                        type="hidden"
                        name="usuario_id"
                        value={usuarioSeleccionado.id}
                      />

                      <input
                        type="hidden"
                        name="modulo_clave"
                        value={modulo.clave}
                      />

                      <label className="permission-main-switch">
                        <input
                          type="checkbox"
                          name="habilitado"
                          defaultChecked={
                            permiso?.habilitado === true
                          }
                        />

                        <span>
                          Permitir el ingreso a este módulo
                        </span>
                      </label>

                      <fieldset>
                        <legend>
                          Operaciones autorizadas
                        </legend>

                        <div className="permission-checks">
                          {[
                            [
                              "puede_consultar",
                              "Consultar información",
                            ],
                            [
                              "puede_crear",
                              "Crear registros",
                            ],
                            [
                              "puede_editar",
                              "Editar información",
                            ],
                            [
                              "puede_aprobar",
                              "Aprobar operaciones",
                            ],
                            [
                              "puede_configurar",
                              "Administrar configuración",
                            ],
                          ].map(([campo, etiqueta]) => {
                            const clave =
                              campo as CampoPermiso;

                            return (
                              <label key={clave}>
                                <input
                                  type="checkbox"
                                  name={clave}
                                  defaultChecked={
                                    permiso?.[clave] ===
                                    true
                                  }
                                />

                                <span>{etiqueta}</span>
                              </label>
                            );
                          })}
                        </div>
                      </fieldset>

                      <div className="permission-scope-grid">
                        <label>
                          <span>Alcance de los datos</span>

                          <select
                            name="alcance"
                            defaultValue={
                              permiso?.alcance ||
                              "ninguno"
                            }
                          >
                            <option value="ninguno">
                              Sin acceso a datos
                            </option>

                            <option value="completo">
                              Todos los registros
                            </option>

                            <option value="empresa">
                              Solo una empresa
                            </option>

                            <option value="sede">
                              Solo una sede
                            </option>
                          </select>
                        </label>

                        <label>
                          <span>Empresa autorizada</span>

                          <select
                            name="empresa_id"
                            defaultValue={
                              permiso?.empresa_id
                                ? String(
                                    permiso.empresa_id,
                                  )
                                : ""
                            }
                          >
                            <option value="">
                              No corresponde
                            </option>

                            {empresas.map((empresa) => (
                              <option
                                key={empresa.id}
                                value={empresa.id}
                              >
                                {empresa.nombre}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label>
                          <span>Sede autorizada</span>

                          <input
                            type="text"
                            name="sede"
                            defaultValue={
                              permiso?.sede || ""
                            }
                            placeholder="Ej.: Capital, Jáchal o Iglesia"
                          />
                        </label>
                      </div>

                      <button
                        className="save-permission"
                        type="submit"
                      >
                        Guardar permisos de{" "}
                        {modulo.nombre}
                      </button>
                    </form>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>

      <style>{`
        .permissions-page .main-area {
          width: 100%;
        }

        .permission-user-selector,
        .permission-user-summary,
        .permissions-empty,
        .permission-card {
          border: 1px solid var(--linea);
          border-radius: 18px;
          background: white;
          box-shadow: 0 12px 32px #063f5012;
        }

        .permission-user-selector {
          display: grid;
          grid-template-columns: minmax(250px, 0.8fr) minmax(340px, 1.2fr);
          gap: 28px;
          align-items: end;
          padding: 28px;
          margin-bottom: 24px;
        }

        .permission-user-selector h2,
        .permission-user-summary h2,
        .permission-card h2 {
          margin: 5px 0 7px;
          color: var(--petroleo);
        }

        .permission-user-selector p,
        .permission-user-summary p,
        .permission-card header p {
          margin: 0;
          color: var(--gris);
          line-height: 1.55;
        }

        .permission-user-selector form {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
          align-items: end;
        }

        .permission-user-selector label,
        .permission-scope-grid label {
          display: grid;
          gap: 7px;
        }

        .permission-user-selector label span,
        .permission-scope-grid label span {
          font-weight: 800;
          color: var(--petroleo);
        }

        .permission-user-selector select,
        .permission-scope-grid select,
        .permission-scope-grid input {
          width: 100%;
          min-height: 50px;
          padding: 11px 13px;
          border: 1px solid #aac0c6;
          border-radius: 10px;
          background: white;
          color: var(--tinta);
          font: inherit;
        }

        .permission-user-selector button,
        .save-permission {
          min-height: 50px;
          padding: 12px 20px;
          border: 0;
          border-radius: 10px;
          background: var(--petroleo);
          color: white;
          font: inherit;
          font-weight: 900;
          cursor: pointer;
        }

        .permissions-empty {
          padding: 45px 28px;
          text-align: center;
        }

        .permissions-empty strong {
          display: block;
          margin-bottom: 8px;
          color: var(--petroleo);
          font-size: 21px;
        }

        .permissions-empty p {
          margin: 0;
          color: var(--gris);
        }

        .permission-user-summary {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 24px 28px;
          margin-bottom: 24px;
        }

        .permission-user-avatar {
          display: grid;
          place-items: center;
          width: 66px;
          height: 66px;
          flex: none;
          border-radius: 50%;
          background: var(--petroleo);
          color: white;
          font-size: 22px;
          font-weight: 900;
        }

        .permissions-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 22px;
        }

        .permission-card {
          overflow: hidden;
        }

        .permission-card > header {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          padding: 25px;
          border-bottom: 1px solid var(--linea);
        }

        .permission-state {
          align-self: flex-start;
          flex: none;
          padding: 8px 11px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.06em;
        }

        .permission-state.enabled {
          background: #dff3e9;
          color: #176b52;
        }

        .permission-state.disabled {
          background: #eef2f3;
          color: #687a80;
        }

        .permission-card form {
          display: grid;
          gap: 21px;
          padding: 25px;
        }

        .permission-main-switch {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 15px;
          border: 1px solid #b7ccd1;
          border-radius: 12px;
          background: #eef7f8;
          color: var(--petroleo);
          font-weight: 900;
        }

        .permission-main-switch input,
        .permission-checks input {
          width: 19px;
          height: 19px;
          flex: none;
          accent-color: var(--petroleo);
        }

        .permission-card fieldset {
          margin: 0;
          padding: 18px;
          border: 1px solid var(--linea);
          border-radius: 12px;
        }

        .permission-card legend {
          padding: 0 8px;
          color: var(--petroleo);
          font-weight: 900;
        }

        .permission-checks {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 13px;
        }

        .permission-checks label {
          display: flex;
          align-items: center;
          gap: 9px;
          color: var(--tinta);
        }

        .permission-scope-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 15px;
        }

        .permission-scope-grid label:last-child {
          grid-column: 1 / -1;
        }

        .save-permission {
          width: 100%;
        }

        .save-permission:hover,
        .permission-user-selector button:hover {
          background: var(--petroleo-oscuro);
        }

        :root[data-theme="dark"]
          .permission-user-selector,
        :root[data-theme="dark"]
          .permission-user-summary,
        :root[data-theme="dark"]
          .permissions-empty,
        :root[data-theme="dark"]
          .permission-card {
          background: #18343e;
          border-color: #49636c;
        }

        :root[data-theme="dark"]
          .permission-user-selector h2,
        :root[data-theme="dark"]
          .permission-user-summary h2,
        :root[data-theme="dark"]
          .permission-card h2,
        :root[data-theme="dark"]
          .permissions-empty strong,
        :root[data-theme="dark"]
          .permission-user-selector label span,
        :root[data-theme="dark"]
          .permission-scope-grid label span,
        :root[data-theme="dark"]
          .permission-card legend {
          color: #f1f7f8;
        }

        :root[data-theme="dark"]
          .permission-user-selector select,
        :root[data-theme="dark"]
          .permission-scope-grid select,
        :root[data-theme="dark"]
          .permission-scope-grid input {
          background: #0b222a;
          border-color: #4b6871;
          color: #f5f8f9;
        }

        :root[data-theme="dark"]
          .permission-main-switch {
          background: #173b46;
          border-color: #49636c;
          color: #f1f7f8;
        }

        :root[data-theme="dark"]
          .permission-card fieldset,
        :root[data-theme="dark"]
          .permission-card > header {
          border-color: #49636c;
        }

        :root[data-theme="dark"]
         
