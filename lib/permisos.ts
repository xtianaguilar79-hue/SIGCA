import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Helper centralizado de autorización por módulo.
 *
 * Antes, cada página del sistema (empresas, configuración, reportes,
 * algunas de beneficios) sólo dejaba entrar a usuarios con
 * rol === "administrador", sin consultar la tabla
 * "usuarios_permisos_sistema". Por eso, aunque el administrador general
 * habilitara un permiso desde /gestion/sistema/permisos, el usuario
 * veía la tarjeta (porque /gestion/sistema sí consulta la tabla) pero
 * al entrar era rebotado.
 *
 * A partir de ahora, TODA verificación de acceso a un módulo del
 * sistema debe pasar por acá, para que un permiso otorgado se refleje
 * de inmediato en todos los lugares donde se usa ese módulo, sin tener
 * que tocar código adicional.
 */

export type AccionPermiso =
  | "puede_consultar"
  | "puede_crear"
  | "puede_editar"
  | "puede_aprobar"
  | "puede_configurar";

type FilaPermiso = {
  habilitado: boolean | null;
  alcance: string | null;
  puede_consultar: boolean | null;
  puede_crear: boolean | null;
  puede_editar: boolean | null;
  puede_aprobar: boolean | null;
  puede_configurar: boolean | null;
};

/**
 * Devuelve el permiso crudo de un usuario para un módulo del sistema
 * (o null si no tiene ninguna fila cargada). Sirve para pantallas que
 * necesitan saber el detalle completo (alcance, empresa_id, sede,
 * cada acción) y no sólo un booleano de "puede entrar".
 */
export async function obtenerPermisoModulo(
  supabase: SupabaseClient,
  usuarioId: string,
  moduloClave: string,
) {
  const { data, error } = await supabase
    .from("usuarios_permisos_sistema")
    .select(
      "habilitado,alcance,empresa_id,sede,puede_consultar,puede_crear,puede_editar,puede_aprobar,puede_configurar",
    )
    .eq("usuario_id", usuarioId)
    .eq("modulo_clave", moduloClave)
    .maybeSingle();

  if (error) {
    console.error(
      `No se pudo consultar el permiso del módulo "${moduloClave}":`,
      error.message,
    );
    return null;
  }

  return data as (FilaPermiso & { empresa_id: number | null; sede: string | null }) | null;
}

function permisoHabilitado(permiso: FilaPermiso | null) {
  if (!permiso) return false;
  if (permiso.habilitado !== true) return false;
  if (String(permiso.alcance || "").toLowerCase() === "ninguno") return false;
  return true;
}

/**
 * true si el usuario tiene, para ese módulo, AL MENOS UNA de las
 * acciones pedidas en `acciones` (por defecto, sólo "puede_consultar",
 * que es lo mínimo para poder entrar a ver el módulo).
 */
export async function tienePermisoModulo(
  supabase: SupabaseClient,
  usuarioId: string,
  moduloClave: string,
  acciones: AccionPermiso[] = ["puede_consultar"],
): Promise<boolean> {
  const permiso = await obtenerPermisoModulo(supabase, usuarioId, moduloClave);

  if (!permisoHabilitado(permiso)) return false;

  return acciones.some((accion) => permiso![accion] === true);
}

/**
 * Punto único de entrada para gatear el acceso a un módulo:
 * el administrador general (o quien tenga rol "administrador")
 * siempre puede entrar; cualquier otro usuario necesita que el
 * administrador le haya habilitado el módulo con alguna de las
 * acciones pedidas.
 */
export async function puedeAccederModulo(
  supabase: SupabaseClient,
  usuarioId: string,
  esAdministrador: boolean,
  moduloClave: string,
  acciones: AccionPermiso[] = ["puede_consultar"],
): Promise<boolean> {
  if (esAdministrador) return true;
  return tienePermisoModulo(supabase, usuarioId, moduloClave, acciones);
}

/**
 * true si el usuario es el administrador general del sistema (hoy:
 * Christian Aguilar). Es el único habilitado para otorgar o quitar el
 * rol "Administrador" a otros usuarios (administradores secundarios
 * como Rubén Martín, Eloy Ortiz o Christian Soria).
 */
export async function esAdministradorGeneral(
  supabase: SupabaseClient,
  usuarioId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("usuarios")
    .select("administrador_general")
    .eq("id", usuarioId)
    .maybeSingle();

  if (error) {
    console.error(
      "No se pudo verificar si el usuario es administrador general:",
      error.message,
    );
    return false;
  }

  return data?.administrador_general === true;
}
