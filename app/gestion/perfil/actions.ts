"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateMyProfile(formData: FormData) {
  const supabase = await createClient();
  const { data:{ user } } = await supabase.auth.getUser();
  if (!user) redirect("/acceso");
  const nombre = String(formData.get("nombre") || "").trim();
  const apellido = String(formData.get("apellido") || "").trim();
  const telefono = String(formData.get("telefono") || "").trim();
  const fechaNacimiento = String(formData.get("fecha_nacimiento") || "");
  const compartirCumpleanos = formData.get("compartir_cumpleanos") === "on";
  if (nombre.length < 2 || apellido.length < 2 || telefono.length < 6 || !/^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento)) redirect("/gestion/perfil?estado=datos-invalidos");
  const { error } = await supabase.rpc("actualizar_mi_perfil_sigca", { nuevo_nombre:nombre, nuevo_apellido:apellido, nuevo_telefono:telefono, nueva_fecha_nacimiento:fechaNacimiento, nuevo_compartir_cumpleanos:compartirCumpleanos });
  if (error) redirect("/gestion/perfil?estado=error");
  redirect("/gestion/perfil?estado=guardado");
}
