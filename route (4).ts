import { createClient } from "@/lib/supabase/server";
import { puedeAccederModulo } from "@/lib/permisos";

const TAMANO_LOTE = 1000;

const CAMPOS = [
  { clave: "numero_aoma", etiqueta: "Número AOMA" },
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
  { clave: "antiguedad_original", etiqueta: "Antigüedad del registro original" },
  { clave: "baja_original", etiqueta: "Información de baja original" },
  { clave: "etiquetas", etiqueta: "Etiquetas" },
  { clave: "origen", etiqueta: "Origen del registro" },
] as const;

function celda(valor: unknown) {
  let texto =
    Array.isArray(valor)
      ? valor.join(", ")
      : valor === null || valor === undefined
        ? ""
        : String(valor);

  if (/^[=+\-@]/.test(texto)) texto = `'${texto}`;
  return `"${texto.replaceAll('"', '""')}"`;
}

function mostrarFecha(valor: unknown) {
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
  const estado = String(url.searchParams.get("estado") || "").trim();
  const empresa = String(url.searchParams.get("empresa") || "").trim();
  const solicitados = new Set(url.searchParams.getAll("campo"));

  const camposSeleccionados = CAMPOS.filter(
    (campo) => solicitados.has(campo.clave),
  );

  if (camposSeleccionados.length === 0) {
    return new Response("Seleccioná al menos un dato para exportar", {
      status: 400,
    });
  }

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
        "numero_aoma,apellido_nombres,documento_numero,cuil,empresa_original,estado,fecha_nacimiento,fecha_ingreso,direccion,codigo_postal,provincia,departamento,telefono_fijo,telefono_movil,email,edad_original,antiguedad_original,baja_original,etiquetas,origen",
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

    for (const registro of data || []) {
      registros.push(
        registro as unknown as Record<string, unknown>,
      );
    }
    if (!data || data.length < TAMANO_LOTE) break;
    desde += TAMANO_LOTE;
  }

  const filas = registros.map((registro) =>
    camposSeleccionados
      .map((campo) =>
        celda(
          "fecha" in campo && campo.fecha
            ? mostrarFecha(registro[campo.clave])
            : registro[campo.clave],
        ),
      )
      .join(";"),
  );

  const contenido = `\uFEFF${[
    camposSeleccionados.map((campo) => celda(campo.etiqueta)).join(";"),
    ...filas,
  ].join("\r\n")}`;

  const nombre = [
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
      "Content-Disposition": `attachment; filename="${nombre}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
