import { createClient } from "@/lib/supabase/server";

const TAMANO_LOTE = 1000;

function celda(valor: unknown) {
  let texto =
    valor === null || valor === undefined ? "" : String(valor);

  if (/^[=+\-@]/.test(texto)) texto = `'${texto}`;
  return `"${texto.replaceAll('"', '""')}"`;
}

function mostrarFecha(valor: unknown) {
  if (!valor) return "";
  const [anio, mes, dia] = String(valor).slice(0, 10).split("-");
  return `${dia}/${mes}/${anio}`;
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
  const beneficioId = Number(url.searchParams.get("beneficio") || 0);
  const lugarId = Number(url.searchParams.get("lugar") || 0);
  const desde = String(url.searchParams.get("desde") || "").trim();
  const hasta = String(url.searchParams.get("hasta") || "").trim();
  const buscar = String(url.searchParams.get("buscar") || "").trim();

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

  const entregas: Array<Record<string, unknown>> = [];
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
          cuil,
          empresa_original,
          estado
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
    if (desde) consulta = consulta.gte("fecha_entrega", desde);
    if (hasta) consulta = consulta.lte("fecha_entrega", hasta);
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
      return new Response("No fue posible generar el reporte", {
        status: 500,
      });
    }

    entregas.push(...((data || []) as unknown as Array<Record<string, unknown>>));

    if (!data || data.length < TAMANO_LOTE) break;
    inicio += TAMANO_LOTE;
  }

  const responsablesIds = Array.from(
    new Set(
      entregas
        .map((entrega) => entrega.entregado_por)
        .filter((id): id is string => typeof id === "string" && Boolean(id)),
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

  const encabezado = [
    "Fecha",
    "Beneficio",
    "Cantidad",
    "Lugar de entrega",
    "Número AOMA",
    "Apellido y nombres",
    "DNI",
    "CUIL",
    "Empresa",
    "Estado afiliatorio",
    "Registrado por",
    "Observaciones",
  ];

  const filas = entregas.map((entrega) => {
    const beneficio = entrega.beneficios as { nombre?: string } | null;
    const lugar = entrega.beneficios_lugares_entrega as {
      nombre?: string;
    } | null;
    const afiliado = entrega.afiliados as {
      numero_aoma?: string | number | null;
      apellido_nombres?: string | null;
      documento_numero?: string | null;
      cuil?: string | null;
      empresa_original?: string | null;
      estado?: string | null;
    } | null;

    return [
      mostrarFecha(entrega.fecha_entrega),
      beneficio?.nombre,
      entrega.cantidad,
      lugar?.nombre,
      afiliado?.numero_aoma,
      afiliado?.apellido_nombres,
      afiliado?.documento_numero,
      afiliado?.cuil,
      afiliado?.empresa_original,
      afiliado?.estado,
      typeof entrega.entregado_por === "string"
        ? responsables.get(entrega.entregado_por) || "Usuario institucional"
        : "",
      entrega.observaciones,
    ]
      .map(celda)
      .join(";");
  });

  const contenido = `\uFEFF${[
    encabezado.map(celda).join(";"),
    ...filas,
  ].join("\r\n")}`;

  return new Response(contenido, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="historial-entregas-beneficios.csv"',
      "Cache-Control": "no-store",
    },
  });
}
