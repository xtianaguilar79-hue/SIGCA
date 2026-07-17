import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { DocumentSearch } from "@/components/document-search";
import { buscarDocumento } from "@/lib/biblioteca";
import { createClient } from "@/lib/supabase/server";

export default async function DocumentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
    String(profile.estado).toLowerCase() !== "aprobado"
  ) {
    redirect("/acceso");
  }

  const documento = buscarDocumento((await params).id);

  if (!documento) {
    notFound();
  }

  const name = [profile.nombre, profile.apellido]
    .filter(Boolean)
    .join(" ");

  const isAdmin =
    String(profile.rol).toLowerCase() === "administrador";

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

          <Link href="/gestion/sindical">
            Gestión sindical
          </Link>

          <Link href="/gestion/formacion">
            Formación Sindical
          </Link>

          <Link
            className="active"
            href="/gestion/biblioteca"
          >
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
            {String(profile.rol || "Usuario autorizado")}
          </span>

          <SignOutButton />
        </div>
      </aside>

      <section className="main-area library-document-page">
        <Link
          className="library-back"
          href="/gestion/biblioteca"
        >
          ← Volver a Biblioteca
        </Link>

        <header className="document-header">
          <span>
            {documento.tipo === "ley"
              ? "LEY"
              : "CONVENIO COLECTIVO"}
          </span>

          <p>{documento.numero}</p>

          <h1>{documento.titulo}</h1>

          <p>{documento.resumen}</p>
        </header>

        <DocumentSearch
          html={documento.contenidoHtml}
        />

        <div className="library-notice library-notice-bottom">
          <strong>
            Material de consulta institucional
          </strong>

          <p>
            Ante una situación concreta, consultá la versión
            vigente y solicitá asesoramiento sindical o jurídico.
          </p>
        </div>
      </section>
    </main>
  );
}
