import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PrintReportButton } from "@/components/print-report-button";
import { createClient } from "@/lib/supabase/server";

const TAMANO_LOTE = 1000;

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
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
  }

  return String(valor);
}

export default async function ImprimirReporteAfiliadosPage({
  searchParams,
}: {
  searchParams: Promise<{
    estado?: string;
    empresa?: string;
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
    String(profile.estado).toLowerCase() !== "aprobado" ||
    String(profile.rol).toLowerCase() !== "administrador"
  ) {
    redirect("/gestion");
  }

  const params = await searchParams;
  const estado = String(params.estado || "").trim();
  const empresa = String(params.empresa || "").trim();
  const recibidos = Array.isArray(params.campo)
    ? params.campo
    : params.campo
      ? [params.campo]
      : [];

  const seleccionados = CAMPOS.filter((campo) =>
    recibidos.includes(campo.clave),
  );

  if (seleccionados.length === 0) {
    redirect("/gestion/sistema/reportes/generador");
  }

  let empresaId: number | null = null;

  if (empresa) {
    const { data: empresaEncontrada } = await supabase
      .from("empresas")
      .select("id")
      .eq("nombre", empresa)
      .maybeSingle();

    if (!empresaEncontrada) {
      redirect("/gestion/sistema/reportes/generador");
    }

    empresaId = empresaEncontrada.id;
  }

  const registros: Record<string, unknown>[] = [];
  let desde = 0;

  while (true) {
    let consulta = supabase
      .from("afiliados")
      .select(
        "numero_aoma,apellido_nombres,documento_numero,cuil,empresa_original,estado,fecha_nacimiento,fecha_ingreso,direccion,codigo_postal,provincia,departamento,telefono_fijo,telefono_movil,email,edad_original,antiguedad_original,baja_original,etiquetas,origen",
      )
      .order("apellido_nombres", { ascending: true })
      .range(desde, desde + TAMANO_LOTE - 1);

    if (estado) consulta = consulta.eq("estado", estado);
    if (empresaId !== null) consulta = consulta.eq("empresa_id", empresaId);

    const { data, error } = await consulta;

    if (error) {
      throw new Error("No fue posible preparar el reporte");
    }

    for (const registro of data || []) {
      registros.push(registro as unknown as Record<string, unknown>);
    }

    if (!data || data.length < TAMANO_LOTE) break;
    desde += TAMANO_LOTE;
  }

  const generadoPor = [profile.nombre, profile.apellido]
    .filter(Boolean)
    .join(" ");

  const fechaGeneracion = new Intl.DateTimeFormat("es-AR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date());

  const orientacion = seleccionados.length <= 6 ? "portrait" : "landscape";
  const densidad =
    seleccionados.length <= 5
      ? "print-columns-comfortable"
      : seleccionados.length <= 9
        ? "print-columns-compact"
        : "print-columns-dense";

  return (
    <main
      className={`print-report-page print-${orientacion} ${densidad}`}
    >
      <style>{`
        @media print {
          @page {
            size: A4 ${orientacion};
            margin: 14mm 12mm 15mm;
          }
        }
      `}</style>

      <div className="print-report-toolbar">
        <Link href="/gestion/sistema/reportes/generador">
          ← Volver al generador
        </Link>
        <PrintReportButton />
      </div>

      <header className="print-report-header">
        <div className="print-report-logo">
          <Image
            src="/logo-aoma.png"
            width={64}
            height={64}
            alt="AOMA"
            priority
          />
        </div>

        <div className="print-report-title">
          <strong>SIGCA · AOMA SECCIONAL SAN JUAN</strong>
          <h1>Reporte de afiliados</h1>
          <p>
            Estado: {estado || "Todos"} · Empresa: {empresa || "Todas"}
          </p>
        </div>

        <div className="print-report-mark" aria-hidden="true">
          AOMA
        </div>
      </header>

      <div className="print-report-meta">
        <span>Registros: {registros.length.toLocaleString("es-AR")}</span>
        <span>Generado: {fechaGeneracion}</span>
        <span>Responsable: {generadoPor}</span>
      </div>

      <p className="print-report-mobile-help">
        Deslizá la tabla hacia los costados para consultar todas las columnas.
      </p>

      <div className="print-report-table-scroll">
        <table className="print-report-table">
          <thead>
            <tr>
              {seleccionados.map((campo) => (
                <th
                  className={`report-field-${campo.clave}`}
                  key={campo.clave}
                >
                  {campo.etiqueta}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {registros.map((registro, indice) => (
              <tr key={indice}>
                {seleccionados.map((campo) => (
                  <td
                    className={`report-field-${campo.clave}`}
                    key={campo.clave}
                  >
                    {mostrar(
                      registro[campo.clave],
                      "fecha" in campo && campo.fecha,
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="print-report-footer">
        <span>Documento institucional generado por SIGCA.</span>
        <span className="print-page-number">Página</span>
      </footer>
    </main>
  );
}
