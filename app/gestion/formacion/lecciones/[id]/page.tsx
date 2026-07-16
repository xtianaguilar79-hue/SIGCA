import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type BlockData = { contenido?:string; introduccion?:string; items?:string[]; cierre?:string; estado_recurso?:string };
type Block = { id:string; orden:number; tipo:string; titulo:string|null; obligatorio:boolean; datos:BlockData };

function BlockContent({ block }:{ block:Block }) {
  const data = block.datos || {};
  const special = ["concepto_destacado","advertencia","pregunta_reflexion","ejemplo","resumen"].includes(block.tipo);
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
    {Array.isArray(data.items)&&<ul>{data.items.map((item,index)=><li key={index}>{item}</li>)}</ul>}
    {data.cierre&&<p className="block-close">{data.cierre}</p>}
  </article>;
}

export default async function LessonPage({ params }:{ params:Promise<{id:string}> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data:{ user } } = await supabase.auth.getUser();
  if (!user) redirect("/acceso");
  const { data:profile } = await supabase.from("usuarios").select("estado,activo").eq("id",user.id).maybeSingle();
  if (!profile || profile.activo===false || String(profile.estado).toLowerCase()!=="aprobado") redirect("/acceso");
  const { data:lesson } = await supabase.from("fs_lecciones").select("id,titulo,proposito,objetivo,orden").eq("id",id).maybeSingle();
  if (!lesson) notFound();
  const { data:blocks } = await supabase.from("fs_bloques").select("id,orden,tipo,titulo,obligatorio,datos").eq("leccion_id",id).order("orden");
  return <main className="lesson-page"><header className="lesson-top"><Link href="/gestion/formacion">← Volver a Formación Sindical</Link><span>LECCIÓN {lesson.orden}</span></header><section className="lesson-intro"><p className="kicker">FORMACIÓN SINDICAL</p><h1>{lesson.titulo}</h1><p>{lesson.proposito}</p>{lesson.objetivo&&<div><strong>Objetivo</strong><span>{lesson.objetivo}</span></div>}</section><section className="learning-content">{((blocks??[]) as Block[]).map(block=><BlockContent block={block} key={block.id}/>)}</section><footer className="lesson-footer"><Link href="/gestion/formacion">Volver al recorrido formativo</Link></footer></main>;
}
