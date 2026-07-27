import Image from "next/image";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";

const ROUTE = "/gestion/sistema/permisos";
const VALID_SCOPES = ["ninguno", "completo", "empresa", "sede"];

async function savePermission(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/acceso");

  const { data: isAdmin } = await supabase.rpc(
    "sigca_es_administrador",
    { p_usuario_id: user.id },
  );
  if (!isAdmin) redirect("/gestion");

  const usuarioId = String(formData.get("usuario_id") || "");
  const moduloClave = String(formData.get("modulo_clave") || "");
  const alcance = String(formData.get("alcance") || "ninguno");
  const empresaRaw = String(formData.get("empresa_id") || "");
  const sede = String(formData.get("sede") || "").trim();

  if (!usuarioId || !moduloClave || !VALID_SCOPES.includes(alcance)) {
    redirect(`${ROUTE}?resultado=error`);
  }

  const empresaId =
    alcance === "empresa" && /^\d+$/.test(empresaRaw)
      ? Number(empresaRaw)
      : null;

  if (
    (alcance === "empresa" && empresaId === null) ||
    (alcance === "sede" && !sede)
  ) {
    redirect(
      `${ROUTE}?usuario=${usuarioId}&resultado=alcance_incompleto`,
    );
  }

  const { error } = await supabase
    .from("usuarios_permisos_sistema")
    .upsert(
      {
        usuario_id: usuarioId,
        modulo_clave: moduloClave,
        puede_consultar: formData.get("puede_consultar") === "on",
        puede_crear: formData.get("puede_crear") === "on",
        puede_editar: formData.get("puede_editar") === "on",
        puede_aprobar: formData.get("puede_aprobar") === "on",
        puede_configurar: formData.get("puede_configurar") === "on",
        alcance,
        empresa_id: empresaId,
        sede: alcance === "sede" ? sede : null,
        habilitado: formData.get("habilitado") === "on",
        asignado_por: user.id,
        actualizado_en: new Date().toISOString(),
      },
      { onConflict: "usuario_id,modulo_clave" },
    );

  if (error) {
    redirect(`${ROUTE}?usuario=${usuarioId}&resultado=error`);
  }

  revalidatePath(ROUTE);
  redirect(`${ROUTE}?usuario=${usuarioId}&resultado=guardado`);
}

export default async function SystemPermissionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    usuario?: string;
    resultado?: string;
  }>;
}) {
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
  ) {
    redirect("/gestion");
  }

  const [
    { data: users },
    { data: modules },
    { data: companies },
  ] = await Promise.all([
    supabase
      .from("usuarios")
      .select("id,nombre,apellido,mail,rol,estado,activo")
      .order("apellido")
      .order("nombre"),
    supabase
      .from("sistema_modulos")
      .select("clave,nombre,descripcion,orden")
      .eq("activo", true)
      .order("orden"),
    supabase
      .from("empresas")
      .select("id,nombre")
      .eq("activa", true)
      .order("nombre"),
  ]);

  const params = await searchParams;
  const selectedUserId = String(params.usuario || "");
  const selectedUser = (users || []).find(
    (item) => item.id === selectedUserId,
  );

  const { data: permissions } = selectedUser
    ? await supabase
        .from("usuarios_permisos_sistema")
        .select("*")
        .eq("usuario_id", selectedUser.id)
    : { data: [] };

  const permissionByModule = new Map(
    (permissions || []).map((item) => [item.modulo_clave, item]),
  );

  const name = [profile.nombre, profile.apellido]
    .filter(Boolean)
    .join(" ");

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
          <Link className="active" href="/gestion/sistema">Sistema</Link>
          <Link href="/gestion/perfil">Mi perfil</Link>
          <Link href="/gestion/usuarios">Administración de usuarios</Link>
        </nav>

        <div className="session">
          <strong>{name}</strong>
          <span>Administrador</span>
          <SignOutButton />
        </div>
      </aside>

      <section className="main-area system-permissions-page">
        <Link className="library-back" href="/gestion/sistema">
          ← Volver a Sistema
        </Link>

        <header className="main-head">
          <div>
            <p className="kicker">SISTEMA · SEGURIDAD</p>
            <h1>Permisos de acceso</h1>
            <p>
              Definí qué puede consultar o administrar cada integrante y
              cuál será el alcance de su acceso.
            </p>
          </div>
          <span className="secure">● ACCESO ADMINISTRATIVO</span>
        </header>

        <form className="permission-user-selector" method="get">
          <label htmlFor="usuario">Persona autorizada</label>
          <div>
            <select id="usuario" name="usuario" defaultValue={selectedUserId}>
              <option value="">Seleccioná una persona</option>
              {(users || []).map((item) => (
                <option key={item.id} value={item.id}>
                  {[item.apellido, item.nombre].filter(Boolean).join(", ") ||
                    item.mail} · {item.rol || "Sin función"}
                </option>
              ))}
            </select>
            <button type="submit">Ver permisos</button>
          </div>
        </form>

        {params.resultado === "guardado" && (
          <p className="permission-message success">
            Permiso guardado correctamente.
          </p>
        )}
        {params.resultado === "alcance_incompleto" && (
          <p className="permission-message error">
            Elegí la empresa o escribí la sede correspondiente al alcance.
          </p>
        )}
        {params.resultado === "error" && (
          <p className="permission-message error">
            No fue posible guardar el permiso. Revisá los datos.
          </p>
        )}

        {!selectedUser && (
          <div className="permission-empty">
            <span>◎</span>
            <h2>Seleccioná una persona</h2>
            <p>
              Sus módulos y permisos aparecerán aquí de forma ordenada.
            </p>
          </div>
        )}

        {selectedUser && (
          <>
            <section className="selected-permission-user">
              <div>
                <span>PERMISOS DE</span>
                <h2>
                  {[selectedUser.nombre, selectedUser.apellido]
                    .filter(Boolean)
                    .join(" ") || selectedUser.mail}
                </h2>
                <p>
                  {selectedUser.rol || "Sin función asignada"} ·{" "}
                  {selectedUser.mail}
                </p>
              </div>
              <strong>
                {selectedUser.activo ? "CUENTA ACTIVA" : "CUENTA SUSPENDIDA"}
              </strong>
            </section>

            <div className="permission-modules">
              {(modules || []).map((module) => {
                const permission = permissionByModule.get(module.clave);
                const isAdministrator =
                  String(selectedUser.rol).toLowerCase() === "administrador";
                const defaultAccess = isAdministrator;

                return (
                  <form
                    className="permission-module-card"
                    action={savePermission}
                    key={module.clave}
                  >
                    <input type="hidden" name="usuario_id" value={selectedUser.id} />
                    <input type="hidden" name="modulo_clave" value={module.clave} />

                    <header>
                      <div>
                        <span>{String(module.orden).padStart(2, "0")}</span>
                        <h2>{module.nombre}</h2>
                      </div>
                      <label className="permission-enabled">
                        <input
                          type="checkbox"
                          name="habilitado"
                          defaultChecked={permission?.habilitado ?? defaultAccess}
                        />
                        <span>Habilitado</span>
                      </label>
                    </header>

                    <p>{module.descripcion}</p>

                    <fieldset>
                      <legend>Acciones permitidas</legend>
                      {[
                        ["puede_consultar", "Consultar"],
                        ["puede_crear", "Crear"],
                        ["puede_editar", "Editar"],
                        ["puede_aprobar", "Aprobar"],
                        ["puede_configurar", "Configurar"],
                      ].map(([key, label]) => (
                        <label key={key}>
                          <input
                            type="checkbox"
                            name={key}
                            defaultChecked={
                              permission?.[key] ?? defaultAccess
                            }
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </fieldset>

                    <div className="permission-scope">
                      <label>
                        <span>Alcance</span>
                        <select
                          name="alcance"
                          defaultValue={
                            permission?.alcance ||
                            (defaultAccess ? "completo" : "ninguno")
                          }
                        >
                          <option value="ninguno">Sin acceso a datos</option>
                          <option value="completo">Toda la institución</option>
                          <option value="empresa">Una empresa</option>
                          <option value="sede">Una sede</option>
                        </select>
                      </label>

                      <label>
                        <span>Empresa, si corresponde</span>
                        <select
                          name="empresa_id"
                          defaultValue={permission?.empresa_id || ""}
                        >
                          <option value="">Seleccionar empresa</option>
                          {(companies || []).map((company) => (
                            <option key={company.id} value={company.id}>
                              {company.nombre}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        <span>Sede, si corresponde</span>
                        <input
                          name="sede"
                          defaultValue={permission?.sede || ""}
                          placeholder="Ej.: Jáchal"
                        />
                      </label>
                    </div>

                    <button type="submit">Guardar permiso</button>
                  </form>
                );
              })}
            </div>
          </>
        )}
      </section>

      <style>{`
        .system-permissions-page{width:100%;max-width:1450px}.permission-user-selector{margin:24px 0;padding:22px;border:1px solid var(--linea);border-radius:14px;background:white}.permission-user-selector>label{display:block;margin-bottom:10px;color:var(--petroleo);font-weight:900}.permission-user-selector>div{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px}.permission-user-selector select,.permission-user-selector button,.permission-scope select,.permission-scope input{min-height:50px;border-radius:9px;font:inherit}.permission-user-selector select,.permission-scope select,.permission-scope input{width:100%;padding:11px 13px;border:1px solid #abc0c6;background:white;color:var(--tinta)}.permission-user-selector button,.permission-module-card>button{padding:12px 19px;border:0;border-radius:9px;background:var(--petroleo);color:white;font-weight:900;cursor:pointer}.permission-message,.permission-empty{margin:18px 0;padding:20px;border:1px solid var(--linea);border-radius:13px;background:white}.permission-message.success{border-color:#75ad99;background:#e8f6f0;color:#155541}.permission-message.error{border-color:#c48378;background:#fff0ed;color:#812f24}.permission-empty{text-align:center}.permission-empty>span{display:grid;width:58px;height:58px;margin:0 auto 14px;place-items:center;border-radius:14px;background:#e5f2f5;color:var(--petroleo);font-size:28px}.permission-empty h2{margin:0;color:var(--petroleo);font:700 25px Georgia,serif}.permission-empty p{margin:8px 0 0;color:var(--gris)}.selected-permission-user{display:flex;align-items:center;justify-content:space-between;gap:20px;margin:26px 0 17px;padding:20px 24px;border-radius:14px;background:var(--petroleo);color:white}.selected-permission-user span{font-size:12px;font-weight:900;letter-spacing:.14em}.selected-permission-user h2{margin:5px 0 3px;font:700 28px Georgia,serif}.selected-permission-user p{margin:0;color:#d4e4e8}.selected-permission-user>strong{padding:9px 12px;border-radius:999px;background:#dff3e9;color:#145943;font-size:12px}.permission-modules{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.permission-module-card{display:flex;min-width:0;flex-direction:column;padding:22px;border:1px solid var(--linea);border-radius:14px;background:white}.permission-module-card>header{display:flex;align-items:center;justify-content:space-between;gap:14px}.permission-module-card>header>div{display:flex;align-items:center;gap:12px}.permission-module-card>header>div>span{display:grid;width:46px;height:46px;place-items:center;border-radius:11px;background:#e3f1f4;color:var(--petroleo);font-weight:900}.permission-module-card h2{margin:0;color:var(--petroleo);font:700 24px Georgia,serif}.permission-module-card>p{min-height:45px;color:var(--gris);line-height:1.5}.permission-enabled,.permission-module-card fieldset label{display:flex;align-items:center;gap:8px;font-weight:800}.permission-enabled input,.permission-module-card fieldset input{width:19px;height:19px;accent-color:#17664f}.permission-module-card fieldset{display:flex;flex-wrap:wrap;gap:10px 18px;margin:13px 0 18px;padding:16px;border:1px solid var(--linea);border-radius:11px}.permission-module-card legend{padding:0 7px;color:var(--petroleo);font-size:13px;font-weight:900}.permission-module-card fieldset label{font-size:14px}.permission-scope{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:18px}.permission-scope label{display:grid;align-content:start;gap:7px}.permission-scope label>span{color:var(--petroleo);font-size:13px;font-weight:900}.permission-module-card>button{align-self:flex-end;min-width:180px}.permission-module-card:last-child:nth-child(odd){grid-column:1/-1}:root[data-theme="dark"] .permission-user-selector,:root[data-theme="dark"] .permission-empty,:root[data-theme="dark"] .permission-module-card{background:#18343e;border-color:#49636c}:root[data-theme="dark"] .permission-user-selector>label,:root[data-theme="dark"] .permission-empty h2,:root[data-theme="dark"] .permission-module-card h2,:root[data-theme="dark"] .permission-module-card legend,:root[data-theme="dark"] .permission-scope label>span{color:#f1f7f8}:root[data-theme="dark"] .permission-user-selector select,:root[data-theme="dark"] .permission-scope select,:root[data-theme="dark"] .permission-scope input{background:#0b222a;border-color:#5b7680;color:#f5f8f9}:root[data-theme="dark"] .permission-module-card>header>div>span{background:#244752;color:#a9dce7}:root[data-theme="dark"] .permission-module-card fieldset{border-color:#49636c}:root[data-theme="dark"] .permission-module-card fieldset label,:root[data-theme="dark"] .permission-enabled{color:#e6f0f2}:root[data-theme="dark"] .permission-message.success{background:#173b32;color:#c8f1e2}:root[data-theme="dark"] .permission-message.error{background:#442821;color:#ffc8b3}@media(max-width:900px){.permission-modules{grid-template-columns:1fr}.permission-module-card:last-child:nth-child(odd){grid-column:auto}.permission-scope{grid-template-columns:1fr}}@media(max-width:650px){.permission-user-selector>div{grid-template-columns:1fr}.selected-permission-user{display:grid;padding:18px}.selected-permission-user h2{font-size:23px}.selected-permission-user>strong{width:fit-content}.permission-module-card{padding:17px}.permission-module-card>header{align-items:flex-start}.permission-module-card>header>div>span{width:40px;height:40px}.permission-module-card h2{font-size:21px}.permission-enabled{font-size:13px}.permission-module-card>p{min-height:0}.permission-module-card fieldset{display:grid;grid-template-columns:1fr 1fr}.permission-module-card>button{width:100%;min-height:48px}}
      `}</style>
    </main>
  );
}
