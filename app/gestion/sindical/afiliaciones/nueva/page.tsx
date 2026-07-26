import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AffiliateForm,
  EmpresaAfiliacion,
} from "@/components/affiliate-form";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";

export default async function NuevaAfiliacionPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/acceso");
  }

  const { data: profile } = await supabase
    .from("usuarios")
    .select("nombre,apellido,rol,estado,activo")
    .eq("id", user.id)
    .maybeSingle();

  if (
    !profile ||
    profile.activo === false ||
    String(profile.estado).toLowerCase() !==
      "aprobado"
  ) {
    redirect("/acceso");
  }

  const[
    {data:companyRows},{data:provincias},
    {data:departamentos},{data:localidades},
  ]=await Promise.all([
    supabase.from("empresas").select("id,nombre,rama,domicilio,localidad,provincia,codigo_postal,cuit,correo_electronico,telefono").eq("activa",true).order("nombre"),
    supabase.from("provincias").select("id,nombre").eq("habilitada",true).order("orden"),
    supabase.from("departamentos").select("id,nombre,provincia_id").eq("habilitado",true).order("orden"),
    supabase.from("localidades").select("id,nombre,codigo_postal,departamento_id").eq("habilitada",true).order("orden"),
  ]);

  const companies =
    (companyRows ?? []) as EmpresaAfiliacion[];

  const name = [profile.nombre, profile.apellido]
    .filter(Boolean)
    .join(" ");

  const isAdmin =
    String(profile.rol).toLowerCase() ===
    "administrador";

  return (
    <main className="management">
      <aside className="side">
        <Link className="side-brand" href="/gestion">
          <Image
            src="/logo-aoma.png"
            width={39}
            height={39}
            alt="AOMA"
          />

          <div>
            <strong>SIGCA</strong>
            <span>SECCIONAL SAN JUAN</span>
          </div>
        </Link>

        <nav>
          <Link href="/gestion">
            Inicio institucional
          </Link>

          <Link
            className="active"
            href="/gestion/sindical"
          >
            Gestión sindical
          </Link>

          <Link href="/gestion/formacion">
            Formación Sindical
          </Link>

          <Link href="/gestion/biblioteca">
            Biblioteca
          </Link>

          <Link href="/gestion/perfil">
            Mi perfil
          </Link>

          {isAdmin && (
            <Link href="/gestion/usuarios">
              Administración de usuarios
            </Link>
          )}
        </nav>

        <div className="session">
          <strong>{name}</strong>

          <span>
            {String(
              profile.rol || "Usuario autorizado"
            )}
          </span>

          <SignOutButton />
        </div>
      </aside>

      <section className="main-area">
        <Link
          className="library-back"
          href="/gestion/sindical/afiliaciones"
        >
          ← Volver a Afiliaciones
        </Link>

        <header className="main-head">
          <div>
            <p className="kicker">
              FICHA DE AFILIACIÓN
            </p>

            <h1>Nueva ficha</h1>

            <p>
              Completá los datos disponibles o dejalos
              en blanco para escribirlos con lapicera.
            </p>
          </div>
        </header>

        <AffiliateForm companies={companies} provincias={provincias||[]} departamentos={departamentos||[]} localidades={localidades||[]}/>
      </section>
    </main>
  );
}
