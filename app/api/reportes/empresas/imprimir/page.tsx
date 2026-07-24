import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PrintReportButton } from "@/components/print-report-button";
import { createClient } from "@/lib/supabase/server";

const TAMANO_LOTE = 1000;

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
  if (valor === null || valor === undefined || valor === "") return "—";
  return String(valor);
}

export default async function ImprimirReporteEmpresasPage({
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
    String(profile.estado).toLowerCase() !== "aprobado" ||
    String(profile.rol).toLowerCase() !== "administrador"
  ) {
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
  const seleccionados = CAMPOS.filter((campo) =>
    recibidos.includes(campo.clave),
  );

  if (seleccionados.length === 0) {
    redirect("/gestion/sistema/reportes/empresas");
  }

  const registros: Record<string, unknown>[] = [];
  let desde = 0;

  while (true) {
    let consulta = supabase
      .from("empresas")
      .select(
        "nombre,razon_social,activa,rama,domicilio,localidad,provincia,codigo_postal,cuit,correo_electronico,telefono",
      )
      .order("nombre", { ascending: true })
      .range(desde, desde + TAMANO_LOTE - 1);

    if (estado === "activas") consulta = consulta.eq("activa", true);
    if (estado === "inactivas") consulta = consulta.eq("activa", false);

    if (buscar) {
      const termino = buscar.replaceAll(",", " ");
      consulta = consulta.or(
        `nombre.ilike.%${termino}%,razon_social.ilike.%${termino}%,cuit.ilike.%${termino}%`,
      );
    }

    const { data, error } = await consulta;
    if (error) throw new Error("No fue posible preparar el reporte");

    registros.push(...((data || []) as Record<string, unknown>[]));
    if (!data || data.length < TAMANO_LOTE) break;
    desde += TAMANO_LOTE;
  }

  const responsable = [profile.nombre, profile.apellido]
    .filter(Boolean)
    .join(" ");
  const fecha = new Intl.DateTimeFormat("es-AR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date());
  const orientacion = seleccionados.length <= 6 ? "portrait" : "landscape";
  const densidad =
    seleccionados.length <= 5
      ? "print-columns-comfortable"
      : seleccionados.length <= 8
        ? "print-columns-compact"
        : "print-columns-dense";

  return (
    <main className={`print-report-page print-${orientacion} ${densidad}`}>
      <style>{`@media print{@page{size:A4 ${orientacion};margin:14mm 12mm 15mm}}`}</style>

      <div className="print-report-toolbar">
        <Link href="/gestion/sistema/reportes/empresas">
          ← Volver al reporte
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
          <h1>Reporte de empresas</h1>
          <p>
            Estado: {estado === "todas" ? "Todas" : estado} · Búsqueda:{" "}
            {buscar || "Sin filtro"}
          </p>
        </div>
        <div className="print-report-mark" aria-hidden="true">AOMA</div>
      </header>

      <div className="print-report-meta">
        <span>Registros: {registros.length.toLocaleString("es-AR")}</span>
        <span>Generado: {fecha}</span>
        <span>Responsable: {responsable}</span>
      </div>

      <p className="print-report-mobile-help">
        Deslizá la tabla hacia los costados para consultar todas las columnas.
      </p>

      <div className="print-report-table-scroll">
        <table className="print-report-table">
          <thead>
            <tr>
              {seleccionados.map((campo) => (
                <th className={`report-field-${campo.clave}`} key={campo.clave}>
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
                    {mostrar(registro[campo.clave], campo.clave)}
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
