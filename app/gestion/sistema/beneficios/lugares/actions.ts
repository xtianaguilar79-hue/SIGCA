"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const RUTA = "/gestion/sistema/beneficios/lugares";

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

export async function crearLugarEntrega(formData: FormData) {
  const supabase = await verificarAdministrador();
  const nombre = String(formData.get("nombre") || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleUpperCase("es-AR");

  if (nombre.length < 2) {
    redirect(`${RUTA}?error=nombre`);
  }

  const { data: existente } = await supabase
    .from("beneficios_lugares_entrega")
    .select("id,activo")
    .ilike("nombre", nombre)
    .maybeSingle();

  if (existente) {
    if (!existente.activo) {
      await supabase
        .from("beneficios_lugares_entrega")
        .update({ activo: true })
        .eq("id", existente.id);

      revalidatePath(RUTA);
      revalidatePath("/gestion/sistema/beneficios");
      redirect(`${RUTA}?reactivado=1`);
    }

    redirect(`${RUTA}?error=duplicado`);
  }

  const { error } = await supabase
    .from("beneficios_lugares_entrega")
    .insert({ nombre, activo: true });

  if (error) redirect(`${RUTA}?error=guardado`);

  revalidatePath(RUTA);
  revalidatePath("/gestion/sistema/beneficios");
  redirect(`${RUTA}?creado=1`);
}

export async function cambiarEstadoLugar(formData: FormData) {
  const supabase = await verificarAdministrador();
  const id = Number(formData.get("id"));
  const activo = String(formData.get("activo")) === "true";

  if (!Number.isInteger(id) || id <= 0) redirect(RUTA);

  const { error } = await supabase
    .from("beneficios_lugares_entrega")
    .update({ activo: !activo })
    .eq("id", id);

  if (error) redirect(`${RUTA}?error=estado`);

  revalidatePath(RUTA);
  revalidatePath("/gestion/sistema/beneficios");
  revalidatePath("/gestion/sistema/beneficios/entregar");
}
