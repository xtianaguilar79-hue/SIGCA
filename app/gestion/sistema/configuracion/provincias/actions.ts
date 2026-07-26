"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const RUTA = "/gestion/sistema/configuracion/provincias";

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
    String(profile.estado).toLowerCase() !== "aprobado" ||
    String(profile.rol).toLowerCase() !== "administrador"
  ) {
    redirect("/gestion");
  }

  return supabase;
}

export async function crearProvincia(formData: FormData) {
  const supabase = await verificarAdministrador();
  const nombre = String(formData.get("nombre") || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleUpperCase("es-AR");
  const orden = Number(formData.get("orden"));

  if (
    nombre.length < 3 ||
    !Number.isInteger(orden) ||
    orden < 0
  ) {
    redirect(`${RUTA}?error=datos`);
  }

  const { error } = await supabase.from("provincias").insert({
    nombre,
    orden,
    habilitada: true,
  });

  if (error) redirect(`${RUTA}?error=guardado`);

  revalidatePath(RUTA);
  redirect(`${RUTA}?creada=1`);
}

export async function actualizarProvincia(
  formData: FormData,
) {
  const supabase = await verificarAdministrador();
  const id = Number(formData.get("id"));
  const orden = Number(formData.get("orden"));
  const habilitada =
    String(formData.get("habilitada")) === "true";

  if (
    !Number.isInteger(id) ||
    id <= 0 ||
    !Number.isInteger(orden) ||
    orden < 0
  ) {
    redirect(`${RUTA}?error=datos`);
  }

  const { error } = await supabase
    .from("provincias")
    .update({ orden, habilitada })
    .eq("id", id);

  if (error) redirect(`${RUTA}?error=actualizacion`);

  revalidatePath(RUTA);
  redirect(`${RUTA}?actualizada=1`);
}
