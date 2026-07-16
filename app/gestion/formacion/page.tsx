import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";

type Module = { id:string; orden:number; titulo:string; descripcion:string|null; duracion_minutos:number|null };
type Lesson = { id:string; modulo_id:string; orden:number; titulo:string; proposito:string|null; duracion_minutos:number|null };

export default async function FormationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/acceso");
  const { data: profile } = await supabase.from("usuarios").select("nombre,apellido,rol,estado,activo").eq("id", user.id).maybeSingle();
  if (!profile || profile.activo === false || String(profile.estado).toLowerCase() !== "aprobado") redirect("/acceso");

  const isAdmin = String(profile.rol).toLowerCase() === "administrador";
  const name = [profile.nombre, profile.apellido].filter(Boolean).join(" ");
  const { data: courses, error } = await supabase.from("fs_cursos").select("id,titulo,subtitulo,descripcion_corta,nivel,modalidad,duracion_minutos,estado,version").order("creado_en", { ascending:false });
  const course = courses?.[0] ?? null;
  let modules:Module[] = [], lessons:Lesson[] = [];
  if (course) {
    const result = await supabase.from("fs_modulos").select("id,orden,titulo,descripcion,duracion_minutos").eq("curso_id", course.id).order("orden");
    modules = (result.data ?? []) as Module[];
    if (modules.length) {
      const lessonResult = await supabase.from("fs_lecciones").select("id,modulo_id,orden,titulo,proposito,duracion_minutos").in("modulo_id", modules.map(m => m.id)).order("orden");
      lessons = (lessonResult.data ?? []) as Lesson[];
    }
  }

  return <main className="management">
    <aside className="side"><div className="side-brand"><Image src="/logo-aoma.png" width={39} height={39} alt="AOMA"/><div><strong>SIGCA</strong><span>SECCIONAL SAN JUAN</span></div></div><nav><Link href="/gestion">Inicio institucional</Link><a href="#">Afiliaciones</a><a href="#">Gestión sindical</a><Link className="active" href="/gestion/formacion">Formación Sindical</Link><a href="#">Biblioteca</a>{isAdmin&&<Link href="/gestion/usuarios">Administración de usuarios</Link>}</nav><div className="session"><strong>{name}</strong><span>{String(profile.rol||"Usuario autorizado")}</span><SignOutButton/></div></aside>
    <section className="main-area formation-page"><header className="main-head"><div><p className="kicker">FORMACIÓN SINDICAL</p><h1>Capacitaciones</h1><p>Conocimiento para fortalecer la organización y la representación sindical.</p></div>{isAdmin&&<span className="review-badge">VISTA DE REVISIÓN</span>}</header>
      {error ? <div className="formation-empty"><h2>No pudimos consultar las capacitaciones</h2><p>Revisaremos la conexión con Formación Sindical.</p></div> : !course ? <div className="formation-empty"><h2>Próximamente</h2><p>Las primeras capacitaciones se encuentran en preparación.</p></div> : <>
        <article className="course-hero"><div className="course-mark">FS</div><div className="course-copy"><div className="course-meta"><span>{course.nivel||"Nivel inicial"}</span><span>{course.modalidad||"Autogestionada"}</span><span>{course.duracion_minutos||0} minutos</span></div><h2>{course.titulo}</h2>{course.subtitulo&&<h3>{course.subtitulo}</h3>}<p>{course.descripcion_corta}</p><div className="course-status"><strong>{course.estado}</strong><span>Versión {course.version}</span></div></div></article>
        <section className="course-content"><div className="section-heading"><div><p className="kicker">CONTENIDO DISPONIBLE</p><h2>Recorrido formativo</h2></div><span>{lessons.length} lecciones</span></div>
          {modules.map(module=><article className="formation-module" key={module.id}><header><span className="module-number">{String(module.orden).padStart(2,"0")}</span><div><h3>{module.titulo}</h3><p>{module.descripcion}</p></div><small>{module.duracion_minutos} min</small></header><div className="lesson-list">{lessons.filter(l=>l.modulo_id===module.id).map(lesson=><div className="lesson-row" key={lesson.id}><span>{lesson.orden}</span><div><strong>{lesson.titulo}</strong><p>{lesson.proposito}</p></div><small>{lesson.duracion_minutos} min</small></div>)}</div></article>)}
          {isAdmin&&<div className="review-note"><strong>Contenido en revisión</strong><p>Este curso todavía no está publicado. Solo los administradores pueden verlo mientras completamos recursos, actividades y control de calidad.</p></div>}
        </section></>}
    </section>
  </main>;
}
