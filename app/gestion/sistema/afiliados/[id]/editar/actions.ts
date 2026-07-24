"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function texto(formData: FormData, nombre: string) {
  const valor = String(formData.get(nombre) || "").trim();
  return valor || null;
}

export async function actualizarAfiliado(
  formData: FormData,
) {
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

  const id = String(formData.get("id") || "");

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    )
  ) {
    redirect("/gestion/sistema/afiliados");
  }

  const email = texto(formData, "email");

  if (
    email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    redirect(
      `/gestion/sistema/afiliados/${id}/editar?error=correo`,
    );
  }

  const { error } = await supabase
    .from("afiliados")
    .update({
      apellido_nombres: texto(
        formData,
        "apellido_nombres",
      ),
      fecha_nacimiento: texto(
        formData,
        "fecha_nacimiento",
      ),
      direccion: texto(formData, "direccion"),
      codigo_postal: texto(formData, "codigo_postal"),
      provincia: texto(formData, "provincia"),
      departamento: texto(formData, "departamento"),
      telefono_fijo: texto(formData, "telefono_fijo"),
      telefono_movil: texto(formData, "telefono_movil"),
      email: email?.toLowerCase() || null,
    })
    .eq("id", id);

  if (error) {
    redirect(
      `/gestion/sistema/afiliados/${id}/editar?error=guardado`,
    );
  }

  revalidatePath(`/gestion/sistema/afiliados/${id}`);
  revalidatePath("/gestion/sistema/afiliados");

  redirect(
    `/gestion/sistema/afiliados/${id}?actualizado=1`,
  );
}
