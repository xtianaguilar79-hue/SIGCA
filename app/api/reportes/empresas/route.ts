import { createClient } from "@/lib/supabase/server";
import { puedeAccederModulo } from "@/lib/permisos";

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

function celda(valor: unknown, clave: string) {
  let texto =
    clave === "activa"
      ? valor === true
        ? "ACTIVA"
        : "INACTIVA"
      : valor === null || valor === undefined
        ? ""
        : String(valor);

  if (/^[=+\-@]/.test(texto)) texto = `'${texto}`;
  return `"${texto.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return new Response("Acceso no autorizado", { status: 401 });

  const { data: profile } = await supabase
    .from("usuarios")
    .select("rol,estado,activo")
    .eq("id", user.id)
    .maybeSingle();

  if (
    !profile ||
    profile.activo === false ||
    String(profile.estado).toLowerCase() !== "aprobado"
  ) {
    return new Response("Acceso no autorizado", { status: 403 });
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
    return new Response("Acceso no autorizado", { status: 403 });
  }

  const url = new URL(request.url);
  const buscar = String(url.searchParams.get("buscar") || "").trim();
  const estado = String(url.searchParams.get("estado") || "todas").trim();
  const solicitados = new Set(url.searchParams.getAll("campo"));
  const seleccionados = CAMPOS.filter((campo) =>
    solicitados.has(campo.clave),
  );

  if (seleccionados.length === 0) {
    return new Response("Seleccioná al menos un campo", { status: 400 });
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

    if (error) {
      return new Response("No fue posible generar el reporte", {
        status: 500,
      });
    }

    registros.push(...((data || []) as Record<string, unknown>[]));
    if (!data || data.length < TAMANO_LOTE) break;
    desde += TAMANO_LOTE;
  }

  const encabezado = seleccionados
    .map((campo) => celda(campo.etiqueta, campo.clave))
    .join(";");

  const filas = registros.map((registro) =>
    seleccionados
      .map((campo) => celda(registro[campo.clave], campo.clave))
      .join(";"),
  );

  const contenido = `\uFEFF${[encabezado, ...filas].join("\r\n")}`;
  const nombre = `reporte-empresas-${estado}-${new Date()
    .toISOString()
    .slice(0, 10)}`;

  return new Response(contenido, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombre}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
