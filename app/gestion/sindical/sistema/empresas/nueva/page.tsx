import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";
import { puedeAccederModulo } from "@/lib/permisos";
import { crearEmpresa } from "../actions";
import { TerritoryFields } from "@/components/territory-fields";

export default async function NuevaEmpresaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
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
    String(profile.estado).toLowerCase() !== "aprobado"
  ) {
    redirect("/gestion");
  }

  const esAdministrador =
    String(profile.rol).toLowerCase() === "administrador";

  const autorizado = await puedeAccederModulo(
    supabase,
    user.id,
    esAdministrador,
    "empresas",
    ["puede_crear"],
  );

  if (!autorizado) {
    redirect("/gestion");
  }

  const query = await searchParams;
  const [{data:provincias},{data:departamentos},{data:localidades}]=await Promise.all([
    supabase.from("provincias").select("id,nombre").eq("habilitada",true).order("orden"),
    supabase.from("departamentos").select("id,nombre,provincia_id").eq("habilitado",true).order("orden"),
    supabase.from("localidades").select("id,nombre,codigo_postal,departamento_id").eq("habilitada",true).order("orden"),
  ]);
  const nombreUsuario = [
    profile.nombre,
    profile.apellido,
  ]
    .filter(Boolean)
    .join(" ");

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
          <Link href="/gestion">Inicio institucional</Link>
          <Link href="/gestion/sindical">Gestión sindical</Link>
          <Link href="/gestion/formacion">Formación Sindical</Link>
          <Link href="/gestion/biblioteca">Biblioteca</Link>
          <Link href="/gestion/perfil">Mi perfil</Link>
          <Link className="active" href="/gestion/sistema">
            Sistema
          </Link>
          <Link href="/gestion/usuarios">
            Administración de usuarios
          </Link>
        </nav>

        <div className="session">
          <strong>{nombreUsuario}</strong>
          <span>Administrador</span>
          <SignOutButton />
        </div>
      </aside>

      <section className="main-area company-form-page">
        <Link
          className="library-back"
          href="/gestion/sistema/empresas"
        >
          ← Volver a Empresas
        </Link>

        <header className="main-head">
          <div>
            <p className="kicker">SISTEMA · EMPRESAS</p>
            <h1>Nueva empresa</h1>
            <p>
              Incorporá un nuevo empleador al registro
              institucional de SIGCA.
            </p>
          </div>
        </header>

        {query.error === "nombre" && (
          <div className="form-message error">
            El nombre de la empresa es obligatorio.
          </div>
        )}

        {query.error === "duplicada" && (
          <div className="form-message error">
            Ya existe una empresa registrada con ese nombre.
          </div>
        )}

        {query.error === "guardado" && (
          <div className="form-message error">
            No fue posible guardar la empresa.
          </div>
        )}

        <form action={crearEmpresa} className="company-form">
          <div className="company-form-grid">
            <label>
              <span>Nombre para mostrar *</span>
              <input name="nombre" required />
            </label>

            <label>
              <span>Razón social</span>
              <input name="razon_social" />
            </label>

            <label>
              <span>CUIT</span>
              <input
                name="cuit"
                placeholder="30-12345678-9"
              />
            </label>

            <label>
              <span>Rama o convenio</span>
              <input name="rama" />
            </label>

            <label className="full">
              <span>Domicilio</span>
              <input name="domicilio" />
            </label>

            <TerritoryFields provincias={provincias||[]} departamentos={departamentos||[]} localidades={localidades||[]}/>

            <label>
              <span>Teléfono</span>
              <input name="telefono" type="tel" />
            </label>

            <label className="full">
              <span>Correo electrónico</span>
              <input
                name="correo_electronico"
                type="email"
              />
            </label>

            <label className="company-active-field full">
              <input
                name="activa"
                type="checkbox"
                defaultChecked
              />
              <span>
                Incorporar la empresa como activa
              </span>
            </label>
          </div>

          <div className="affiliate-edit-actions">
            <Link href="/gestion/sistema/empresas">
              Cancelar
            </Link>
            <button type="submit">
              Guardar empresa
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
