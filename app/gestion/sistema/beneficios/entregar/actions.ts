"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function registrarEntregaBeneficio(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/acceso");

  const beneficioId = Number(formData.get("beneficio_id"));
  const afiliadoId = String(formData.get("afiliado_id") || "");
  const lugarId = Number(formData.get("lugar_entrega_id"));
  const cantidad = Number(formData.get("cantidad") || 1);
  const observaciones = String(formData.get("observaciones") || "").trim();

  if (
    !Number.isInteger(beneficioId) ||
    !Number.isInteger(lugarId) ||
    !Number.isInteger(cantidad) ||
    cantidad <= 0 ||
    !/^[0-9a-f-]{36}$/i.test(afiliadoId)
  ) {
    redirect("/gestion/sistema/beneficios/entregar?error=datos");
  }

  const { error } = await supabase.rpc("registrar_entrega_beneficio", {
    p_beneficio_id: beneficioId,
    p_afiliado_id: afiliadoId,
    p_lugar_entrega_id: lugarId,
    p_cantidad: cantidad,
    p_observaciones: observaciones || null,
  });

  if (error) {
    const mensaje = encodeURIComponent(error.message.slice(0, 120));
    redirect(
      `/gestion/sistema/beneficios/entregar?error=entrega&detalle=${mensaje}`,
    );
  }

  redirect("/gestion/sistema/beneficios/entregar?guardado=1");
}
