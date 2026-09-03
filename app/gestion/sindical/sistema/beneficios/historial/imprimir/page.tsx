import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PrintReportButton } from "@/components/print-report-button";
import { createClient } from "@/lib/supabase/server";
import { puedeAccederModulo } from "@/lib/permisos";

const TAMANO_LOTE = 1000;

function mostrarFecha(valor: string) {
  const [anio, mes, dia] = valor.slice(0, 10).split("-");
  return `${dia}/${mes}/${anio}`;
}

export default async function ImprimirHistorialBeneficiosPage({
  searchParams,
}: {
  searchParams: Promise<{
    buscar?: string;
    beneficio?: string;
    lugar?: string;
    desde?: string;
    hasta?: string;
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
    "beneficios",
    ["puede_consultar"],
  );

  if (!autorizado) {
    redirect("/gestion");
  }

  const params = await searchParams;
  const buscar = String(params.buscar || "").trim();
  const beneficioId = Number(params.beneficio || 0);
  const lugarId = Number(params.lugar || 0);
  const desdeFecha = String(params.desde || "");
  const hastaFecha = String(params.hasta || "");

  let afiliadosEncontrados: string[] | null = null;

  if (buscar.length >= 2) {
    const seguro = buscar.replaceAll(",", " ");
    const filtros = [
      `apellido_nombres.ilike.%${seguro}%`,
      `cuil.ilike.%${seguro}%`,
    ];

    if (/^\d+$/.test(seguro)) {
      filtros.push(`documento_numero.eq.${seguro}`);
      filtros.push(`numero_aoma.eq.${seguro}`);
    }

    const { data } = await supabase
      .from("afiliados")
      .select("id")
      .or(filtros.join(","))
      .limit(500);

    afiliadosEncontrados = (data || []).map((afiliado) => afiliado.id);
  }

  const entregas: Array<{
    id: number;
    cantidad: number;
    fecha_entrega: string;
    observaciones: string | null;
    entregado_por: string | null;
    beneficios: { nombre: string } | null;
    beneficios_lugares_entrega: { nombre: string } | null;
    afiliados: {
      numero_aoma: string | number | null;
      apellido_nombres: string | null;
      documento_numero: string | null;
      empresa_original: string | null;
    } | null;
  }> = [];

  let inicio = 0;

  while (true) {
    let consulta = supabase
      .from("beneficios_entregas")
      .select(`
        id,
        cantidad,
        fecha_entrega,
        observaciones,
        entregado_por,
        beneficios ( nombre ),
        beneficios_lugares_entrega ( nombre ),
        afiliados (
          numero_aoma,
          apellido_nombres,
          documento_numero,
          empresa_original
        )
      `)
      .order("fecha_entrega", { ascending: false })
      .range(inicio, inicio + TAMANO_LOTE - 1);

    if (beneficioId > 0) {
      consulta = consulta.eq("beneficio_id", beneficioId);
    }
    if (lugarId > 0) {
      consulta = consulta.eq("lugar_entrega_id", lugarId);
    }
    if (desdeFecha) consulta = consulta.gte("fecha_entrega", desdeFecha);
    if (hastaFecha) consulta = consulta.lte("fecha_entrega", hastaFecha);

    if (afiliadosEncontrados !== null) {
      if (afiliadosEncontrados.length === 0) {
        consulta = consulta.eq(
          "afiliado_id",
          "00000000-0000-0000-0000-000000000000",
        );
      } else {
        consulta = consulta.in("afiliado_id", afiliadosEncontrados);
      }
    }

    const { data, error } = await consulta;

    if (error) {
      throw new Error("No fue posible generar el reporte de beneficios.");
    }

    entregas.push(
      ...((data || []) as unknown as typeof entregas),
    );

    if (!data || data.length < TAMANO_LOTE) break;
    inicio += TAMANO_LOTE;
  }

  const responsablesIds = Array.from(
    new Set(
      entregas
        .map((entrega) => entrega.entregado_por)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const responsables = new Map<string, string>();

  if (responsablesIds.length > 0) {
    const { data: usuarios } = await supabase
      .from("usuarios")
      .select("id,nombre,apellido")
      .in("id", responsablesIds);

    for (const usuario of usuarios || []) {
      responsables.set(
        usuario.id,
        [usuario.nombre, usuario.apellido].filter(Boolean).join(" "),
      );
    }
  }

  const responsable = [profile.nombre, profile.apellido]
    .filter(Boolean)
    .join(" ");
  const volverParams = new URLSearchParams();

  if (buscar) volverParams.set("buscar", buscar);
  if (beneficioId > 0) {
    volverParams.set("beneficio", String(beneficioId));
  }
  if (lugarId > 0) {
    volverParams.set("lugar", String(lugarId));
  }
  if (desdeFecha) volverParams.set("desde", desdeFecha);
  if (hastaFecha) volverParams.set("hasta", hastaFecha);

  return (
    <main className="benefit-print-page">
      <div className="benefit-print-actions">
        <Link href={`/gestion/sistema/beneficios/historial?${volverParams.toString()}`}>
          ← Volver al historial
        </Link>
        <PrintReportButton />
      </div>

      <header className="benefit-print-header">
        <Image src="/logo-aoma.png" width={72} height={72} alt="AOMA" />
        <div>
          <p>SIGCA · AOMA SECCIONAL SAN JUAN</p>
          <h1>Entregas de beneficios</h1>
          <span>Reporte institucional</span>
        </div>
      </header>

      <section className="benefit-print-meta">
        <strong>Registros: {entregas.length.toLocaleString("es-AR")}</strong>
        <span>Generado: {new Date().toLocaleString("es-AR")}</span>
        <span>Responsable: {responsable}</span>
      </section>

      <div className="benefit-print-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Afiliado</th>
              <th>AOMA</th>
              <th>Empresa</th>
              <th>Beneficio</th>
              <th>Cant.</th>
              <th>Lugar</th>
              <th>Registrado por</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {entregas.map((entrega) => (
              <tr key={entrega.id}>
                <td>{mostrarFecha(entrega.fecha_entrega)}</td>
                <td>
                  <strong>{entrega.afiliados?.apellido_nombres || "Sin informar"}</strong>
                  <small>DNI {entrega.afiliados?.documento_numero || "—"}</small>
                </td>
                <td>{entrega.afiliados?.numero_aoma ?? 0}</td>
                <td>{entrega.afiliados?.empresa_original || "—"}</td>
                <td>{entrega.beneficios?.nombre || "—"}</td>
                <td>{entrega.cantidad}</td>
                <td>{entrega.beneficios_lugares_entrega?.nombre || "—"}</td>
                <td>
                  {entrega.entregado_por
                    ? responsables.get(entrega.entregado_por) ||
                      "Usuario institucional"
                    : "—"}
                </td>
                <td>{entrega.observaciones || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
