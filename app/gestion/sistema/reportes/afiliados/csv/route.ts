import { createClient } from "@/lib/supabase/server";

const TAMANO_LOTE = 1000;

function celda(valor: unknown) {
  let texto = valor === null || valor === undefined ? "" : String(valor);
  if (/^[=+\-@]/.test(texto)) texto = `'${texto}`;
  return `"${texto.replaceAll('"', '""')}"`;
}

function fecha(valor: unknown) {
  if (!valor) return "";
  const partes = String(valor).slice(0, 10).split("-");
  return partes.length === 3
    ? `${partes[2]}/${partes[1]}/${partes[0]}`
    : String(valor);
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Acceso no autorizado", { status: 401 });
  }

  const { data: profile } = await supabase
    .from("usuarios")
    .select("rol,estado,activo")
    .eq("id", user.id)
    .maybeSingle();

  if (
    !profile ||
    profile.activo === false ||
    String(profile.estado).toLowerCase() !== "aprobado" ||
    String(profile.rol).toLowerCase() !== "administrador"
  ) {
    return new Response("Acceso no autorizado", { status: 403 });
  }

  const url = new URL(request.url);
  const estado = String(url.searchParams.get("estado") || "").trim();
  const empresa = String(url.searchParams.get("empresa") || "").trim();

  let empresaId: number | null = null;

  if (empresa) {
    const { data: empresaEncontrada } = await supabase
      .from("empresas")
      .select("id")
      .eq("nombre", empresa)
      .maybeSingle();

    if (!empresaEncontrada) {
      return new Response("La empresa indicada no existe", { status: 400 });
    }

    empresaId = empresaEncontrada.id;
  }

  const registros: Record<string, unknown>[] = [];
  let desde = 0;

  while (true) {
    let consulta = supabase
      .from("afiliados")
      .select(
        "numero_aoma,apellido_nombres,documento_numero,cuil,empresa_original,estado,fecha_nacimiento,fecha_ingreso,telefono_fijo,telefono_movil,email",
      )
      .order("apellido_nombres", { ascending: true })
      .range(desde, desde + TAMANO_LOTE - 1);

    if (estado) consulta = consulta.eq("estado", estado);
    if (empresaId !== null) consulta = consulta.eq("empresa_id", empresaId);

    const { data, error } = await consulta;

    if (error) {
      return new Response("No fue posible generar el reporte", {
        status: 500,
      });
    }

    registros.push(...(data || []));

    if (!data || data.length < TAMANO_LOTE) break;
    desde += TAMANO_LOTE;
  }

  const encabezados = [
    "Número AOMA",
    "Apellido y nombres",
    "DNI",
    "CUIL",
    "Empresa",
    "Estado",
    "Fecha de nacimiento",
    "Fecha de ingreso",
    "Teléfono fijo",
    "Teléfono móvil",
    "Correo electrónico",
  ];

  const filas = registros.map((item) =>
    [
      item.numero_aoma,
      item.apellido_nombres,
      item.documento_numero,
      item.cuil,
      item.empresa_original,
      item.estado,
      fecha(item.fecha_nacimiento),
      fecha(item.fecha_ingreso),
      item.telefono_fijo,
      item.telefono_movil,
      item.email,
    ]
      .map(celda)
      .join(";"),
  );

  const contenido = `\uFEFF${[
    encabezados.map(celda).join(";"),
    ...filas,
  ].join("\r\n")}`;

  const partesNombre = [
    "reporte-afiliados",
    estado || "todos-los-estados",
    empresa || "todas-las-empresas",
  ]
    .join("-")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();

  return new Response(contenido, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${partesNombre}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
