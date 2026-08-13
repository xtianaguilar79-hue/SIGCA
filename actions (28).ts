"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { puedeAccederModulo } from "@/lib/permisos";

const RUTA =
  "/gestion/sistema/configuracion/estados-afiliatorios";

async function verificarAdministrador() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/acceso");

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
    redirect("/gestion");
  }

  const esAdministrador =
    String(profile.rol).toLowerCase() === "administrador";

  const autorizado = await puedeAccederModulo(
    supabase,
    user.id,
    esAdministrador,
    "configuracion",
    ["puede_configurar"],
  );

  if (!autorizado) {
    redirect("/gestion");
  }

  return supabase;
}

export async function crearEstadoAfiliatorio(
  formData: FormData,
) {
  const supabase = await verificarAdministrador();
  const nombre = String(formData.get("nombre") || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleUpperCase("es-AR");
  const descripcion =
    String(formData.get("descripcion") || "").trim() || null;
  const orden = Number(formData.get("orden"));

  if (
    nombre.length < 3 ||
    !Number.isInteger(orden) ||
    orden < 0
  ) {
    redirect(`${RUTA}?error=datos`);
  }

  const { error } = await supabase
    .from("estados_afiliado")
    .insert({
      nombre,
      descripcion,
      orden,
      habilitado: true,
    });

  if (error) redirect(`${RUTA}?error=guardado`);

  revalidatePath(RUTA);
  revalidatePath("/gestion/sistema/afiliados");
  revalidatePath("/gestion/sistema/reportes/generador");
  redirect(`${RUTA}?creado=1`);
}

export async function actualizarEstadoAfiliatorio(
  formData: FormData,
) {
  const supabase = await verificarAdministrador();
  const nombre = String(formData.get("nombre") || "").trim();
  const descripcion =
    String(formData.get("descripcion") || "").trim() || null;
  const orden = Number(formData.get("orden"));
  const habilitado =
    String(formData.get("habilitado")) === "true";

  if (
    !nombre ||
    !Number.isInteger(orden) ||
    orden < 0
  ) {
    redirect(`${RUTA}?error=datos`);
  }

  const { error } = await supabase
    .from("estados_afiliado")
    .update({
      descripcion,
      orden,
      habilitado,
    })
    .eq("nombre", nombre);

  if (error) redirect(`${RUTA}?error=actualizacion`);

  revalidatePath(RUTA);
  revalidatePath("/gestion/sistema/afiliados");
  revalidatePath("/gestion/sistema/reportes/generador");
  redirect(`${RUTA}?actualizado=1`);
}
