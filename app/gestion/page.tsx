import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ManagementPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/acceso");

  const { data: profile } = await supabase
    .from("usuarios")
    .select("nombre,apellido,rol,estado,activo")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.activo === false || String(profile.estado).toLowerCase() !== "aprobado") {
    redirect("/acceso");
  }

  const name = [profile.nombre, profile.apellido].filter(Boolean).join(" ");

  return (
    <main className="management">
      <aside className="side">
        <div className="side-brand">
          <Image src="/logo-aoma.png" width={39} height={39} alt="AOMA" />
          <div><strong>SIGCA</strong><span>SECCIONAL SAN JUAN</span></div>
        </div>
        <nav>
          <a className="active" href="#">Inicio institucional</a>
          <a href="#">Afiliaciones</a><a href="#">Gestión sindical</a>
          <a href="#">Academia AOMA</a><a href="#">Biblioteca</a><a href="#">Administración</a>
        </nav>
        <div className="session"><strong>{name}</strong><span>{String(profile.rol || "Usuario autorizado")}</span></div>
      </aside>
      <section className="main-area">
        <header className="main-head">
          <div><p className="kicker">GESTIÓN INSTITUCIONAL</p><h1>Buen día, {profile.nombre}</h1><p>Tu espacio de trabajo sindical está protegido y listo.</p></div>
          <span className="secure">● SESIÓN SEGURA</span>
        </header>
        <div className="cards">
          <article className="module"><span>▤</span><h2>Afiliaciones</h2><p>Solicitudes, fichas oficiales y seguimiento administrativo por empresa autorizada.</p><small>PRÓXIMA ETAPA</small></article>
          <article className="module"><span>◇</span><h2>Gestión sindical</h2><p>Actas, visitas, inspecciones, reclamos, compromisos y expedientes relacionados.</p><small>EN PREPARACIÓN</small></article>
          <article className="module"><span>◫</span><h2>Academia AOMA</h2><p>Formación para dirigentes y delegados con contenidos, actividades y certificación.</p><small>CONTENIDO RECUPERADO</small></article>
        </div>
      </section>
    </main>
  );
}
