"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function texto(formData: FormData, campo: string) {
  const valor = String(formData.get(campo) || "").trim();
  return valor || null;
}

async function verificarAdministrador() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/acceso");
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
    redirect("/gestion");
  }

  return supabase;
}

export async function crearEmpresa(formData: FormData) {
  const supabase = await verificarAdministrador();

  const nombre = String(formData.get("nombre") || "")
    .trim()
    .toUpperCase();

  if (nombre.length < 2) {
    redirect(
      "/gestion/sistema/empresas/nueva?error=nombre",
    );
  }

  const { data: existente } = await supabase
    .from("empresas")
    .select("id")
    .eq("nombre", nombre)
    .maybeSingle();

  if (existente) {
    redirect(
      "/gestion/sistema/empresas/nueva?error=duplicada",
    );
  }

  const { error } = await supabase
    .from("empresas")
    .insert({
      nombre,
      razon_social: texto(formData, "razon_social"),
      rama: texto(formData, "rama"),
      domicilio: texto(formData, "domicilio"),
      localidad: texto(formData, "localidad"),
      provincia: texto(formData, "provincia"),
      codigo_postal: texto(formData, "codigo_postal"),
      cuit: texto(formData, "cuit"),
      correo_electronico: texto(
        formData,
        "correo_electronico",
      ),
      telefono: texto(formData, "telefono"),
      activa: formData.get("activa") === "on",
    });

  if (error) {
    redirect(
      "/gestion/sistema/empresas/nueva?error=guardado",
    );
  }

  revalidatePath("/gestion/sistema/empresas");
  revalidatePath(
    "/gestion/sindical/afiliaciones/nueva",
  );

  redirect(
    "/gestion/sistema/empresas?empresa_creada=1",
  );
}
