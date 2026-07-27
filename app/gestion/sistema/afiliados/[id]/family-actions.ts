"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const VINCULOS_VALIDOS = [
  "CÓNYUGE",
  "CONVIVIENTE",
  "HIJO/A",
  "PADRE",
  "MADRE",
  "HERMANO/A",
  "OTRO",
];

function texto(formData: FormData, nombre: string) {
  return String(formData.get(nombre) || "").trim();
}

export async function agregarFamiliar(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/acceso");
  }

  const afiliadoId = texto(formData, "afiliado_id");
  const apellidoNombres = texto(
    formData,
    "apellido_nombres",
  ).toUpperCase();
  const vinculo = texto(formData, "vinculo").toUpperCase();

  if (
    !afiliadoId ||
    apellidoNombres.length < 3 ||
    !VINCULOS_VALIDOS.includes(vinculo)
  ) {
    redirect(
      `/gestion/sistema/afiliados/${afiliadoId}?familia_error=datos`,
    );
  }

  const documentoTipo =
    texto(formData, "documento_tipo").toUpperCase() || "DNI";

  const documentoNumero = texto(
    formData,
    "documento_numero",
  );

  const fechaNacimiento = texto(
    formData,
    "fecha_nacimiento",
  );

  const cuil = texto(formData, "cuil");
  const telefono = texto(formData, "telefono");
  const correoElectronico = texto(
    formData,
    "correo_electronico",
  ).toLowerCase();

  const poseeDiscapacidad =
    texto(formData, "posee_discapacidad") === "true";

  const observaciones = texto(
    formData,
    "observaciones",
  );

  const { error } = await supabase
    .from("afiliados_familiares")
    .insert({
      afiliado_id: afiliadoId,
      apellido_nombres: apellidoNombres,
      vinculo,
      documento_tipo: documentoTipo,
      documento_numero: documentoNumero || null,
      fecha_nacimiento: fechaNacimiento || null,
      cuil: cuil || null,
      telefono: telefono || null,
      correo_electronico: correoElectronico || null,
      posee_discapacidad: poseeDiscapacidad,
      observaciones: observaciones || null,
      activo: true,
    });

  if (error) {
    console.error("Error al guardar familiar:", error);

    redirect(
      `/gestion/sistema/afiliados/${afiliadoId}?familia_error=guardado`,
    );
  }

  const ruta = `/gestion/sistema/afiliados/${afiliadoId}`;

  revalidatePath(ruta);
  redirect(`${ruta}?familia_guardada=1`);
}
