"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { puedeAccederModulo, type AccionPermiso } from "@/lib/permisos";

async function verificarAdministrador(
  acciones: AccionPermiso[] = ["puede_crear", "puede_editar"],
) {
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
    "beneficios",
    acciones,
  );

  if (!autorizado) {
    redirect("/gestion");
  }

  return { supabase, user };
}

function fecha(formData: FormData, campo: string) {
  const valor = String(formData.get(campo) || "").trim();
  return valor || null;
}

export async function crearBeneficio(formData: FormData) {
  const { supabase, user } = await verificarAdministrador(["puede_crear"]);
  const nombre = String(formData.get("nombre") || "").trim().toUpperCase();
  const descripcion = String(formData.get("descripcion") || "").trim();
  const stockTexto = String(formData.get("stock") || "").trim();
  const stock = stockTexto === "" ? null : Number(stockTexto);

  if (nombre.length < 3) {
    redirect("/gestion/sistema/beneficios?error=nombre");
  }

  if (stock !== null && (!Number.isInteger(stock) || stock < 0)) {
    redirect("/gestion/sistema/beneficios?error=stock");
  }

  const { error } = await supabase.from("beneficios").insert({
    nombre,
    descripcion: descripcion || null,
    fecha_inicio: fecha(formData, "fecha_inicio"),
    fecha_fin: fecha(formData, "fecha_fin"),
    stock,
    activo: true,
    creado_por: user.id,
  });

  if (error) {
    redirect("/gestion/sistema/beneficios?error=guardado");
  }

  revalidatePath("/gestion/sistema/beneficios");
  redirect("/gestion/sistema/beneficios?creado=1");
}

export async function cambiarEstadoBeneficio(formData: FormData) {
  const { supabase } = await verificarAdministrador([
    "puede_editar",
    "puede_aprobar",
  ]);
  const id = Number(formData.get("id"));
  const activo = String(formData.get("activo")) === "true";

  if (!Number.isInteger(id) || id <= 0) {
    redirect("/gestion/sistema/beneficios");
  }

  await supabase
    .from("beneficios")
    .update({ activo: !activo })
    .eq("id", id);

  revalidatePath("/gestion/sistema/beneficios");
}
