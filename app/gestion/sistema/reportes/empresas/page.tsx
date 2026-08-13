import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";
import { puedeAccederModulo } from "@/lib/permisos";

const CAMPOS = [
  { clave: "nombre", etiqueta: "Nombre" },
  { clave: "razon_social", etiqueta: "Razón social" },
  { clave: "activa", etiqueta: "Estado" },
  { clave: "rama", etiqueta: "Rama" },
  { clave: "domicilio", etiqueta: "Domicilio" },
  { clave: "localidad", etiqueta: "Localidad" },
  { clave: "provincia", etiqueta: "Provincia" },
  { clave: "codigo_postal", etiqueta: "Código postal" },
  { clave: "cuit", etiqueta: "CUIT" },
  { clave: "correo_electronico", etiqueta: "Correo electrónico" },
  { clave: "telefono", etiqueta: "Teléfono" },
] as const;

function mostrar(valor: unknown, clave: string) {
  if (clave === "activa") return valor === true ? "ACTIVA" : "INACTIVA";
  if (valor === null || valor === undefined || valor === "") return "Sin informar";
  return String(valor);
}

export default async function ReporteEmpresasPage({
  searchParams,
}: {
  searchParams: Promise<{
    buscar?: string;
    estado?: string;
    campo?: string | string[];
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
    String(profile.estado).toLowerCase() !== "aprobado"
  ) {
    redirect("/gestion");
  }

  const esAdministrador =
    String(profile.rol).toLowerCase() === "administrador";

  const autorizado = await puedeAccederModulo(
    supabase,
    user.id,
    esAdministrador,
    "reportes",
    ["puede_consultar"],
  );

  if (!autorizado) {
    redirect("/gestion");
  }

  const params = await searchParams;
  const buscar = String(params.buscar || "").trim();
  const estado = String(params.estado || "todas").trim();
  const recibidos = Array.isArray(params.campo)
    ? params.campo
    : params.campo
      ? [params.campo]
      : [];
  const camposSeleccionados = CAMPOS.filter((campo) =>
    recibidos.includes(campo.clave),
  );

  let consulta = supabase
    .from("empresas")
    .select(
      "id,nombre,razon_social,activa,rama,domicilio,localidad,provincia,codigo_postal,cuit,correo_electronico,telefono",
      { count: "exact" },
    )
    .order("nombre", { ascending: true })
    .limit(50);

  if (estado === "activas") consulta = consulta.eq("activa", true);
  if (estado === "inactivas") consulta = consulta.eq("activa", false);

  if (buscar) {
    const termino = buscar.replaceAll(",", " ");
    consulta = consulta.or(
      `nombre.ilike.%${termino}%,razon_social.ilike.%${termino}%,cuit.ilike.%${termino}%`,
    );
  }

  const { data: empresas, count, error } = await consulta;
  const name = [profile.nombre, profile.apellido].filter(Boolean).join(" ");

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
          <Link href="/gestion/perfil">Mi perfil</Link>
          <Link className="active" href="/gestion/sistema">Sistema</Link>
          <Link href="/gestion/usuarios">Administración de usuarios</Link>
        </nav>

        <div className="session">
          <strong>{name}</strong>
          <span>Administrador</span>
          <SignOutButton />
        </div>
      </aside>

      <section className="main-area company-report-page">
        <Link className="library-back" href="/gestion/sistema/reportes">
          ← Volver a Reportes
        </Link>

        <header className="main-head">
          <div>
            <p className="kicker">SISTEMA · REPORTES</p>
            <h1>Reporte de empresas</h1>
            <p>
              Filtrá las empresas y elegí la información que necesitás incluir.
            </p>
          </div>
          <span className="secure">● ACCESO ADMINISTRATIVO</span>
        </header>

        <form className="company-report-builder" method="get">
          <div className="company-report-filters">
            <label>
              <span>Buscar empresa</span>
              <input
                type="search"
                name="buscar"
                defaultValue={buscar}
                placeholder="Nombre, razón social o CUIT"
              />
            </label>

            <label>
              <span>Estado</span>
              <select name="estado" defaultValue={estado}>
                <option value="todas">Todas</option>
                <option value="activas">Activas</option>
                <option value="inactivas">Inactivas</option>
              </select>
            </label>
          </div>

          <fieldset className="company-report-fields">
            <legend>Datos que se mostrarán en el reporte</legend>
            <p>Las opciones comienzan destildadas. Elegí solamente las necesarias.</p>

            <div>
              {CAMPOS.map((campo) => (
                <label key={campo.clave}>
                  <input
                    type="checkbox"
                    name="campo"
                    value={campo.clave}
                    defaultChecked={recibidos.includes(campo.clave)}
                  />
                  <span>{campo.etiqueta}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="company-report-actions">
            <button type="submit">Aplicar filtros y campos</button>
            <Link href="/gestion/sistema/reportes/empresas">Limpiar</Link>
            {camposSeleccionados.length > 0 && (
              <>
                <button
                  className="company-report-export"
                  type="submit"
                  formAction="/api/reportes/empresas"
                >
                  Descargar CSV
                </button>
                <button
                  className="company-report-export company-report-export-pdf"
                  type="submit"
                  formAction="/gestion/sistema/reportes/empresas/imprimir"
                >
                  Generar PDF
                </button>
              </>
            )}
          </div>
        </form>

        <div className="company-report-result">
          <div>
            <strong>{(count || 0).toLocaleString("es-AR")} empresas</strong>
            <span>La vista previa muestra hasta 50 registros.</span>
          </div>
        </div>

        {error ? (
          <div className="form-message error">
            No fue posible consultar las empresas.
          </div>
        ) : camposSeleccionados.length === 0 ? (
          <div className="company-report-empty">
            Seleccioná uno o más datos para generar la vista previa.
          </div>
        ) : (
          <div className="company-report-table-scroll">
            <table className="company-report-table">
              <thead>
                <tr>
                  {camposSeleccionados.map((campo) => (
                    <th key={campo.clave}>{campo.etiqueta}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(empresas || []).map((empresa) => (
                  <tr key={empresa.id}>
                    {camposSeleccionados.map((campo) => (
                      <td key={campo.clave}>
                        {mostrar(
                          empresa[campo.clave as keyof typeof empresa],
                          campo.clave,
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
