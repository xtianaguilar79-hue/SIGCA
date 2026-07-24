"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function cambiarEstadoAfiliado(
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
  const estado = String(formData.get("estado") || "").trim();
  const observacion = String(
    formData.get("observacion") || "",
  ).trim();

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    )
  ) {
    redirect("/gestion/sistema/afiliados");
  }

  if (!estado || observacion.length < 5) {
    redirect(
      `/gestion/sistema/afiliados/${id}?estado_error=datos`,
    );
  }

  const { error } = await supabase.rpc(
    "cambiar_estado_afiliado",
    {
      p_afiliado_id: id,
      p_estado_nuevo: estado,
      p_observacion: observacion,
    },
  );

  if (error) {
    redirect(
      `/gestion/sistema/afiliados/${id}?estado_error=guardado`,
    );
  }

  revalidatePath(`/gestion/sistema/afiliados/${id}`);
  revalidatePath("/gestion/sistema/afiliados");

  redirect(
    `/gestion/sistema/afiliados/${id}?estado_actualizado=1`,
  );
}
