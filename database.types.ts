import { createClient } from "./server";

export async function getActiveCompanies() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("empresas")
    .select("id,nombre,activa")
    .eq("activa", true)
    .order("nombre");

  if (error) throw error;
  return data;
}

export async function getActiveAgreements() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("convenios")
    .select("id,nombre,activo")
    .eq("activo", true)
    .order("nombre");

  if (error) throw error;
  return data;
}
