"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { puedeAccederModulo } from "@/lib/permisos";

const RUTA="/gestion/sistema/configuracion/localidades";
async function admin(){
  const supabase=await createClient();
  const{data:{user}}=await supabase.auth.getUser();
  if(!user)redirect("/acceso");
  const{data:p}=await supabase.from("usuarios").select("rol,estado,activo").eq("id",user.id).maybeSingle();
  if(!p||p.activo===false||String(p.estado).toLowerCase()!=="aprobado")redirect("/gestion");
  const esAdministrador=String(p.rol).toLowerCase()==="administrador";
  const autorizado=await puedeAccederModulo(supabase,user.id,esAdministrador,"configuracion",["puede_configurar"]);
  if(!autorizado)redirect("/gestion");
  return supabase;
}
export async function crearLocalidad(formData:FormData){
  const supabase=await admin();
  const departamento_id=Number(formData.get("departamento_id"));
  const nombre=String(formData.get("nombre")||"").trim().replace(/\s+/g," ").toLocaleUpperCase("es-AR");
  const codigo_postal=String(formData.get("codigo_postal")||"").trim().toLocaleUpperCase("es-AR")||null;
  const orden=Number(formData.get("orden"));
  if(!Number.isInteger(departamento_id)||departamento_id<=0||nombre.length<2||!Number.isInteger(orden)||orden<0)redirect(`${RUTA}?error=datos`);
  const{error}=await supabase.from("localidades").insert({departamento_id,nombre,codigo_postal,orden,habilitada:true});
  if(error)redirect(`${RUTA}?error=guardado`);
  revalidatePath(RUTA);redirect(`${RUTA}?creada=1`);
}
export async function actualizarLocalidad(formData:FormData){
  const supabase=await admin();
  const id=Number(formData.get("id")),orden=Number(formData.get("orden"));
  const codigo_postal=String(formData.get("codigo_postal")||"").trim().toLocaleUpperCase("es-AR")||null;
  const habilitada=String(formData.get("habilitada"))==="true";
  if(!Number.isInteger(id)||id<=0||!Number.isInteger(orden)||orden<0)redirect(`${RUTA}?error=datos`);
  const{error}=await supabase.from("localidades").update({codigo_postal,orden,habilitada}).eq("id",id);
  if(error)redirect(`${RUTA}?error=actualizacion`);
  revalidatePath(RUTA);redirect(`${RUTA}?actualizada=1`);
}
