import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { completeLesson } from "../../actions";

type BlockData = { contenido?:string; introduccion?:string; items?:string[]; cierre?:string; situacion?:string; tarea?:string[]; resolucion?:string; estado_recurso?:string; recurso_id?:string };
type Block = { id:string; orden:number; tipo:string; titulo:string|null; obligatorio:boolean; datos:BlockData };
type Resource = { id:string; tipo:string; titulo:string; estado:string; ruta:string|null; datos:{ texto_alternativo?:string; descripcion_accesible?:string; ruta_mobile?:string } };

function BlockContent({ block, resource }:{ block:Block; resource?:Resource }) {
  const data = block.datos || {};
  const special = ["concepto_destacado","advertencia","pregunta_reflexion","ejemplo","resumen"].includes(block.tipo);
  if (block.tipo === "imagen" && resource?.ruta) {
    const alt = resource.datos?.texto_alternativo || resource.titulo;
    const horizontal=resource.ruta.toLowerCase().endsWith(".webp");
    return <figure className="learning-resource"><picture>{resource.datos?.ruta_mobile&&<source media="(max-width: 700px)" srcSet={resource.datos.ruta_mobile}/>}<Image src={resource.ruta} width={horizontal?1600:1080} height={horizontal?1000:1620} alt={alt}/></picture><figcaption>{resource.titulo}</figcaption></figure>;
  }
  if (block.tipo === "descargable" && resource?.ruta) {
    return <article className="learning-block download-block"><span>MATERIAL DESCARGABLE</span><h2>{resource.titulo}</h2><p>{resource.datos?.descripcion_accesible || resource.datos?.texto_alternativo || "Material complementario para utilizar durante la capacitación."}</p><a href={resource.ruta} target="_blank" rel="noreferrer">Abrir guía en PDF</a></article>;
  }
  if (["imagen","video_youtube","descargable"].includes(block.tipo) && data.estado_recurso === "pendiente_produccion") {
    return <article className="learning-block resource-pending"><span>RECURSO EN PREPARACIÓN</span><h2>{block.titulo}</h2><p>Este recurso ilustrativo se incorporará durante la revisión final del curso.</p></article>;
  }
  if (["actividad_interactiva","evaluacion"].includes(block.tipo)) {
    return <article className="learning-block activity-block"><span>{block.tipo === "evaluacion" ? "COMPROBACIÓN" : "ACTIVIDAD"}</span><h2>{block.titulo}</h2><p>Esta actividad será habilitada en la siguiente etapa de integración.</p></article>;
  }
  return <article className={`learning-block ${special ? `block-${block.tipo}` : ""}`}>
    {block.titulo&&<h2>{block.titulo}</h2>}
    {data.introduccion&&<p>{data.introduccion}</p>}
    {data.contenido&&<p>{data.contenido}</p>}
    {data.situacion&&<p><strong>Situación:</strong> {data.situacion}</p>}
    {Array.isArray(data.tarea)&&<><h3>Consigna</h3><ul>{data.tarea.map((item,index)=><li key={index}>{item}</li>)}</ul></>}
    {Array.isArray(data.items)&&<ul>{data.items.map((item,index)=><li key={index}>{item}</li>)}</ul>}
    {data.resolucion&&<p className="block-close"><strong>Orientación:</strong> {data.resolucion}</p>}
    {data.cierre&&<p className="block-close">{data.cierre}</p>}
  </article>;
}

export default async function LessonPage({ params,searchParams }:{ params:Promise<{id:string}>;searchParams:Promise<{estado?:string}> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data:{ user } } = await supabase.auth.getUser();
  if (!user) redirect("/acceso");
  const { data:profile } = await supabase.from("usuarios").select("estado,activo").eq("id",user.id).maybeSingle();
  if (!profile || profile.activo===false || String(profile.estado).toLowerCase()!=="aprobado") redirect("/acceso");
  const { data:lesson } = await supabase.from("fs_lecciones").select("id,titulo,proposito,objetivo,orden").eq("id",id).maybeSingle();
  if (!lesson) notFound();
  const { data:blocks } = await supabase.from("fs_bloques").select("id,orden,tipo,titulo,obligatorio,datos").eq("leccion_id",id).order("orden");
  const { data:resources } = await supabase.from("fs_recursos").select("id,tipo,titulo,estado,ruta,datos").eq("leccion_id",id);
  const {data:progress}=await supabase.from("fs_progreso_lecciones").select("estado").eq("usuario_id",user.id).eq("leccion_id",id).maybeSingle();
  const {estado}=await searchParams;
  const resourceMap = new Map(((resources??[]) as Resource[]).map(resource=>[resource.id,resource]));
  const completed=progress?.estado==="completada";
  return <main className="lesson-page"><header className="lesson-top"><Link href="/gestion/formacion">← Volver a Formación Sindical</Link><span>LECCIÓN {lesson.orden}</span></header><section className="lesson-intro"><p className="kicker">FORMACIÓN SINDICAL</p><h1>{lesson.titulo}</h1><p>{lesson.proposito}</p>{lesson.objetivo&&<div><strong>Objetivo</strong><span>{lesson.objetivo}</span></div>}</section>{estado==="completada"&&<div className="lesson-feedback">Lección completada. Tu progreso quedó guardado.</div>}{estado==="error"&&<div className="lesson-feedback error">No pudimos guardar el progreso. Intentá nuevamente.</div>}<section className="learning-content">{((blocks??[]) as Block[]).map(block=><BlockContent block={block} resource={block.datos?.recurso_id ? resourceMap.get(block.datos.recurso_id) : undefined} key={block.id}/>)}</section><footer className="lesson-footer"><Link href="/gestion/formacion">Volver al recorrido formativo</Link>{completed?<span className="lesson-done">✓ Lección completada</span>:<form action={completeLesson}><input type="hidden" name="lesson_id" value={id}/><button type="submit">Marcar como completada</button></form>}</footer></main>;
}
