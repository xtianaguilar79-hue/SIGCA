"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function esUuid(valor: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    valor,
  );
}

export async function registrarEntregaBeneficio(
  formData: FormData,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/acceso");

  const beneficioId = Number(
    formData.get("beneficio_id"),
  );

  const lugarId = Number(
    formData.get("lugar_entrega_id"),
  );

  const cantidad = Number(
    formData.get("cantidad") || 1,
  );

  const observaciones = String(
    formData.get("observaciones") || "",
  ).trim();

  const destinatario = String(
    formData.get("destinatario") || "",
  );

  const [afiliadoId, familiarIdOriginal] =
    destinatario.split("|");

  const familiarId = familiarIdOriginal || null;

  if (
    !Number.isInteger(beneficioId) ||
    !Number.isInteger(lugarId) ||
    !Number.isInteger(cantidad) ||
    cantidad <= 0 ||
    !esUuid(afiliadoId) ||
    (familiarId !== null && !esUuid(familiarId))
  ) {
    redirect(
      "/gestion/sistema/beneficios/entregar?error=datos",
    );
  }

  const { error } = await supabase.rpc(
    "registrar_entrega_beneficio",
    {
      p_beneficio_id: beneficioId,
      p_afiliado_id: afiliadoId,
      p_lugar_entrega_id: lugarId,
      p_cantidad: cantidad,
      p_observaciones: observaciones || null,
      p_familiar_id: familiarId,
    },
  );

  if (error) {
    const mensaje = encodeURIComponent(
      error.message.slice(0, 160),
    );

    redirect(
      `/gestion/sistema/beneficios/entregar?error=entrega&detalle=${mensaje}`,
    );
  }

  redirect(
    `/gestion/sistema/beneficios/entregar?lugar=${lugarId}&guardado=1`,
  );
}
