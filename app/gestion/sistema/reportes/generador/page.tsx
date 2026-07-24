import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";

const VISTA_PREVIA = 50;

const CAMPOS = [
  { clave: "numero_aoma", etiqueta: "N.º AOMA" },
  { clave: "apellido_nombres", etiqueta: "Apellido y nombres" },
  { clave: "documento_numero", etiqueta: "DNI" },
  { clave: "cuil", etiqueta: "CUIL" },
  { clave: "empresa_original", etiqueta: "Empresa" },
  { clave: "estado", etiqueta: "Estado" },
  { clave: "fecha_nacimiento", etiqueta: "Fecha de nacimiento", fecha: true },
  { clave: "fecha_ingreso", etiqueta: "Fecha de ingreso", fecha: true },
  { clave: "direccion", etiqueta: "Domicilio" },
  { clave: "codigo_postal", etiqueta: "Código postal" },
  { clave: "provincia", etiqueta: "Provincia" },
  { clave: "departamento", etiqueta: "Departamento" },
  { clave: "telefono_fijo", etiqueta: "Teléfono fijo" },
  { clave: "telefono_movil", etiqueta: "Teléfono móvil" },
  { clave: "email", etiqueta: "Correo electrónico" },
  { clave: "edad_original", etiqueta: "Edad del registro original" },
  { clave: "antiguedad_original", etiqueta: "Antigüedad original" },
  { clave: "baja_original", etiqueta: "Información de baja" },
  { clave: "etiquetas", etiqueta: "Etiquetas" },
  { clave: "origen", etiqueta: "Origen del registro" },
] as const;

function mostrar(valor: unknown, esFecha = false) {
  if (valor === null || valor === undefined || valor === "") return "—";
  if (Array.isArray(valor)) return valor.join(", ") || "—";
  if (esFecha) {
    const partes = String(valor).slice(0, 10).split("-");
    if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return String(valor);
}

export default async function GeneradorReporteAfiliadosPage({
  searchParams,
}: {
  searchParams: Promise<{
    estado?: string;
    empresa?: string;
    campo?: string | string[];
    seleccion?: string;
  }>;
}) {
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

  const params = await searchParams;
  const estadoSeleccionado = String(params.estado || "").trim();
  const empresaSeleccionada = String(params.empresa || "").trim();
  const recibidos = Array.isArray(params.campo)
    ? params.campo
    : params.campo
      ? [params.campo]
      : [];
  const camposSeleccionados = CAMPOS.filter(
    (campo) => recibidos.includes(campo.clave),
  );

  const [{ data: estados }, { data: empresas }] = await Promise.all([
    supabase
      .from("estados_afiliado")
      .select("nombre")
      .eq("habilitado", true)
      .order("orden"),
    supabase.from("empresas").select("id,nombre,activa").order("nombre"),
  ]);

  const empresaEncontrada = (empresas || []).find(
    (item) => item.nombre === empresaSeleccionada,
  );

  let consulta = supabase
    .from("afiliados")
    .select(
      "id,numero_aoma,apellido_nombres,documento_numero,cuil,empresa_original,estado,fecha_nacimiento,fecha_ingreso,direccion,codigo_postal,provincia,departamento,telefono_fijo,telefono_movil,email,edad_original,antiguedad_original,baja_original,etiquetas,origen",
      { count: "exact" },
    )
    .order("apellido_nombres", { ascending: true })
    .range(0, VISTA_PREVIA - 1);

  if (estadoSeleccionado) consulta = consulta.eq("estado", estadoSeleccionado);
  if (empresaEncontrada) consulta = consulta.eq("empresa_id", empresaEncontrada.id);
  if (empresaSeleccionada && !empresaEncontrada) {
    consulta = consulta.eq("empresa_id", -1);
  }

  const { data: afiliados, count, error } = await consulta;
  const total = count || 0;

  const exportParams = new URLSearchParams();
  if (estadoSeleccionado) exportParams.set("estado", estadoSeleccionado);
  if (empresaSeleccionada) exportParams.set("empresa", empresaSeleccionada);
  camposSeleccionados
    .forEach((campo) => exportParams.append("campo", campo.clave));

  const name = [profile.nombre, profile.apellido].filter(Boolean).join(" ");

  return (
    <main className="management">
      <aside className="side">
        <Link className="side-brand" href="/gestion">
          <Image src="/logo-aoma.png" width={39} height={39} alt="AOMA" />
          <div><strong>SIGCA</strong><span>SECCIONAL SAN JUAN</span></div>
        </Link>
        <nav>
          <Link href="/gestion">Inicio institucional</Link>
          <Link href="/gestion/sindical">Gestión sindical</Link>
          <Link href="/gestion/formacion">Formación Sindical</Link>
          <Link href="/gestion/biblioteca">Biblioteca</Link>
          <Link href="/gestion/perfil">Mi perfil</Link>
          <Link className="active" href="/gestion/sistema">Sistema</Link>
          <Link href="/gestion/usuarios">Administración de usuarios</Link>
        </nav>
        <div className="session">
          <strong>{name}</strong><span>Administrador</span><SignOutButton />
        </div>
      </aside>

      <section className="main-area report-generator-page">
        <Link className="library-back" href="/gestion/sistema/reportes/afiliados">
          ← Volver al reporte general
        </Link>

        <header className="main-head">
          <div>
            <p className="kicker">REPORTES · GENERADOR</p>
            <h1>Listado de afiliados</h1>
            <p>Elegí filtros y datos para preparar el listado institucional.</p>
          </div>
          <span className="secure">{total.toLocaleString("es-AR")} RESULTADOS</span>
        </header>

        <form className="report-generator-form" method="get">
          <input type="hidden" name="seleccion" value="1" />

          <div className="report-generator-filters">
            <label>
              <span>Estado afiliatorio</span>
              <select name="estado" defaultValue={estadoSeleccionado}>
                <option value="">Todos los estados</option>
                {(estados || []).map((estado) => (
                  <option key={estado.nombre} value={estado.nombre}>
                    {estado.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Empresa</span>
              <input
                type="search"
                name="empresa"
                list="empresas-reporte"
                defaultValue={empresaSeleccionada}
                placeholder="Todas las empresas"
                autoComplete="off"
              />
              <datalist id="empresas-reporte">
                {(empresas || []).map((empresa) => (
                  <option key={empresa.id} value={empresa.nombre}>
                    {empresa.activa ? "Activa" : "Inactiva"}
                  </option>
                ))}
              </datalist>
            </label>

            <div className="report-generator-buttons">
              <button type="submit">Aplicar selección</button>
              <a href="/gestion/sistema/reportes/generador">
  Limpiar y destildar todo
</a>
            </div>
          </div>

          <fieldset className="report-field-selector">
            <legend>Datos que incluirá el reporte</legend>
            <p>
              Inicialmente no hay datos seleccionados. Marcá únicamente las
              columnas que necesites y tocá Aplicar selección.
            </p>
            <div>
              {CAMPOS.map((campo) => (
                <label key={campo.clave}>
                  <input
  key={`${campo.clave}-${
    camposSeleccionados.some(
      (seleccionado) => seleccionado.clave === campo.clave,
    )
      ? "seleccionado"
      : "vacio"
  }`}
  type="checkbox"
  name="campo"
  value={campo.clave}
  defaultChecked={camposSeleccionados.some(
    (seleccionado) => seleccionado.clave === campo.clave,
  )}
/>
                  <span>{campo.etiqueta}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </form>

        <div className="report-export-bar">
          <div>
            <strong>{total.toLocaleString("es-AR")} personas</strong>
            <span>
              {camposSeleccionados.length} columnas seleccionadas. La vista
              muestra 50; el CSV incluye todas.
            </span>
          </div>
          {camposSeleccionados.length > 0 ? (
            <a href={`/api/reportes/afiliados/csv?${exportParams.toString()}`}>
              Descargar CSV
            </a>
          ) : (
            <span className="report-export-disabled">
              Seleccioná al menos un dato
            </span>
          )}
        </div>

        {error ? (
          <div className="form-message error">No fue posible consultar el padrón.</div>
        ) : camposSeleccionados.length === 0 ? (
          <div className="empty-users">
            Marcá los datos que querés incluir y tocá Aplicar selección para
            generar la vista previa.
          </div>
        ) : (
          <div className="report-preview">
            <table>
              <thead>
                <tr>
                  {camposSeleccionados.map((campo) => (
                    <th key={campo.clave}>{campo.etiqueta}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {((afiliados || []) as Record<string, unknown>[]).map(
                  (afiliado, indice) => (
                    <tr key={String(afiliado.id || indice)}>
                      {camposSeleccionados.map((campo) => (
                        <td key={campo.clave}>
                          {mostrar(
                            afiliado[campo.clave],
                            "fecha" in campo && campo.fecha,
                          )}
                        </td>
                      ))}
                    </tr>
                  ),
                )}
              </tbody>
            </table>
            {!afiliados?.length && (
              <div className="empty-users">
                No hay personas que coincidan con los filtros.
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
