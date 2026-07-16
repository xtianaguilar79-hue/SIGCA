"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const allowedRoles = new Set(["Administrador", "Dirigente", "Delegado", "Personal autorizado"]);
const allowedStates = new Set(["Pendiente", "Aprobado", "Rechazado"]);

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sesión no válida.");
  const { data: profile } = await supabase.from("usuarios").select("rol,estado,activo").eq("id", user.id).maybeSingle();
  if (!profile || profile.activo === false || String(profile.estado).toLowerCase() !== "aprobado" || String(profile.rol).toLowerCase() !== "administrador") {
    throw new Error("No tenés autorización para realizar esta acción.");
  }
  return { supabase, currentUserId: user.id };
}

const value = (formData: FormData, key: string) => String(formData.get(key) || "").trim();

export async function updateInstitutionalUser(formData: FormData) {
  const { supabase, currentUserId } = await requireAdmin();
  const id = value(formData, "id");
  const rol = value(formData, "rol");
  const estado = value(formData, "estado");
  const activo = value(formData, "activo") === "true";
  if (!id || !allowedRoles.has(rol) || !allowedStates.has(estado)) throw new Error("Los datos recibidos no son válidos.");
  if (id === currentUserId && (!activo || estado !== "Aprobado" || rol !== "Administrador")) throw new Error("No podés quitarte tu propio acceso de administrador.");
  const { error } = await supabase.from("usuarios").update({ rol, estado, activo, empresa: value(formData, "empresa"), convenio: value(formData, "convenio") }).eq("id", id);
  if (error) throw new Error("No fue posible actualizar la cuenta.");
  revalidatePath("/gestion/usuarios");
}

export async function approveUser(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = value(formData, "id");
  if (!id) throw new Error("Usuario no válido.");
  const { error } = await supabase.from("usuarios").update({ estado: "Aprobado", activo: true }).eq("id", id);
  if (error) throw new Error("No fue posible aprobar la cuenta.");
  revalidatePath("/gestion/usuarios");
}

export async function rejectUser(formData: FormData) {
  const { supabase, currentUserId } = await requireAdmin();
  const id = value(formData, "id");
  if (!id || id === currentUserId) throw new Error("Usuario no válido.");
  const { error } = await supabase.from("usuarios").update({ estado: "Rechazado", activo: false }).eq("id", id);
  if (error) throw new Error("No fue posible rechazar la cuenta.");
  revalidatePath("/gestion/usuarios");
}

export async function deleteUserPermanently(formData: FormData) {
  const { supabase, currentUserId } = await requireAdmin();
  const id = value(formData, "id");
  if (!id || id === currentUserId) throw new Error("No podés eliminar tu propia cuenta administradora.");
  const { error } = await supabase.rpc("eliminar_usuario_sigca", { usuario_id: id });
  if (error) throw new Error("No fue posible eliminar la cuenta.");
  revalidatePath("/gestion/usuarios");
}
