import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";

export default async function AfiliacionesPage() {
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
  const isAdmin = String(profile.rol).toLowerCase() === "administrador";

  return (
    <main className="management">
      <aside className="side">
        <Link className="side-brand" href="/gestion">
          <Image src="/logo-aoma.png" width={39} height={39} alt="AOMA" />
          <div><strong>SIGCA</strong><span>SECCIONAL SAN JUAN</span></div>
        </Link>
        <nav>
          <Link href="/gestion">Inicio institucional</Link>
          <Link className="active" href="/gestion/sindical">Gestión sindical</Link>
          <Link href="/gestion/formacion">Formación Sindical</Link>
          <Link href="/gestion/biblioteca">Biblioteca</Link>
          <Link href="/gestion/perfil">Mi perfil</Link>
          {isAdmin && <Link href="/gestion/usuarios">Administración de usuarios</Link>}
        </nav>
        <div className="session">
          <strong>{name}</strong>
          <span>{String(profile.rol || "Usuario autorizado")}</span>
          <SignOutButton />
        </div>
      </aside>

      <section className="main-area">
        <Link className="library-back" href="/gestion/sindical">← Volver a Gestión Sindical</Link>
        <header className="main-head">
          <div>
            <p className="kicker">GESTIÓN SINDICAL</p>
            <h1>Afiliaciones</h1>
            <p>Preparación, impresión y seguimiento de fichas de afiliación por empresa.</p>
          </div>
        </header>

        <div className="cards">
          <Link className="module module-link" href="/gestion/sindical/afiliaciones/nueva">
            <span>＋</span><h2>Nueva ficha de afiliación</h2>
            <p>Seleccioná la empresa y completá los datos para preparar la ficha oficial.</p>
            <small>INGRESAR</small>
          </Link>

          <Link className="module module-link" href="/gestion/sindical/afiliaciones/solicitudes">
            <span>▤</span><h2>Solicitudes guardadas</h2>
            <p>Consultá las solicitudes pendientes, sus empresas y datos principales.</p>
            <small>DISPONIBLE</small>
          </Link>

          <Link className="module module-link" href="/gestion/sindical/afiliaciones/solicitudes">
            <span>⌕</span><h2>Seguimiento</h2>
            <p>Estado de presentación, observaciones, altas, bajas y traslados.</p>
            <small>CONSULTAR ESTADOS</small>
          </Link>
        </div>
      </section>
    </main>
  );
}
