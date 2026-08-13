"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { puedeAccederModulo } from "@/lib/permisos";

const RUTA="/gestion/sistema/configuracion/departamentos";
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
export async function crearDepartamento(formData:FormData){
  const supabase=await admin();
  const provincia_id=Number(formData.get("provincia_id"));
  const nombre=String(formData.get("nombre")||"").trim().replace(/\s+/g," ").toLocaleUpperCase("es-AR");
  const orden=Number(formData.get("orden"));
  if(!Number.isInteger(provincia_id)||provincia_id<=0||nombre.length<2||!Number.isInteger(orden)||orden<0)redirect(`${RUTA}?error=datos`);
  const{error}=await supabase.from("departamentos").insert({provincia_id,nombre,orden,habilitado:true});
  if(error)redirect(`${RUTA}?error=guardado`);
  revalidatePath(RUTA);redirect(`${RUTA}?creado=1`);
}
export async function actualizarDepartamento(formData:FormData){
  const supabase=await admin();
  const id=Number(formData.get("id")),orden=Number(formData.get("orden"));
  const habilitado=String(formData.get("habilitado"))==="true";
  if(!Number.isInteger(id)||id<=0||!Number.isInteger(orden)||orden<0)redirect(`${RUTA}?error=datos`);
  const{error}=await supabase.from("departamentos").update({orden,habilitado}).eq("id",id);
  if(error)redirect(`${RUTA}?error=actualizacion`);
  revalidatePath(RUTA);redirect(`${RUTA}?actualizado=1`);
}
