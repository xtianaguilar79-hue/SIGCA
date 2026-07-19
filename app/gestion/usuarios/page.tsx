import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";
import { UserAdminPanel } from "./user-admin-panel";
import "./admin-users.css";

export default async function UsersAdministrationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/acceso");

  const { data: profile } = await supabase
    .from("usuarios")
    .select("nombre,apellido,rol,estado,activo")
    .eq("id", user.id)
    .maybeSingle();

  if (
    !profile ||
    profile.activo === false ||
    String(profile.estado).toLowerCase() !== "aprobado" ||
    String(profile.rol).toLowerCase() !== "administrador"
  ) {
    redirect("/gestion");
  }

  const [usersResult, companiesResult, agreementsResult] =
    await Promise.all([
      supabase
        .from("usuarios")
        .select(
          "id,nombre,apellido,dni,telefono,mail,rol,empresa,convenio,estado,activo",
        )
        .order("apellido"),
      supabase
        .from("empresas")
        .select("id,nombre")
        .eq("activa", true)
        .order("nombre"),
      supabase
        .from("convenios")
        .select("id,nombre")
        .eq("activo", true)
        .order("nombre"),
    ]);

  const name = [profile.nombre, profile.apellido].filter(Boolean).join(" ");

  return (
    <main className="management">
      <aside className="side">
        <Link className="side-brand" href="/gestion">
          <Image src="/logo-aoma.png" width={39} height={39} alt="AOMA" />
          <div>
            <strong>SIGCA</strong>
            <span>SECCIONAL SAN JUAN</span>
          </div>
        </Link>

        <nav>
          <Link href="/gestion">Inicio institucional</Link>
          <Link href="/gestion/sindical">Gestión sindical</Link>
          <Link href="/gestion/formacion">Formación Sindical</Link>
          <Link href="/gestion/biblioteca">Biblioteca</Link>
          <Link href="/gestion/perfil">Mi perfil</Link>
          <Link className="active" href="/gestion/usuarios">
            Administración de usuarios
          </Link>
        </nav>

        <div className="session">
          <strong>{name}</strong>
          <span>Administrador</span>
          <SignOutButton />
        </div>
      </aside>

      <section className="main-area admin-users-page">
        <header className="main-head">
          <div>
            <p className="kicker">ADMINISTRACIÓN</p>
            <h1>Usuarios institucionales</h1>
            <p>Revisá solicitudes y administrá los accesos a SIGCA.</p>
          </div>
          <span className="secure">● ACCESO ADMINISTRATIVO</span>
        </header>

        <UserAdminPanel
          users={usersResult.data || []}
          companies={companiesResult.data || []}
          agreements={agreementsResult.data || []}
          currentUserId={user.id}
        />
      </section>
    </main>
  );
}

