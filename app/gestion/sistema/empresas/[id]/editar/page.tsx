import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";
import { puedeAccederModulo } from "@/lib/permisos";
import { actualizarEmpresa } from "../../actions";
import { TerritoryFields } from "@/components/territory-fields";

export default async function EditarEmpresaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
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
    ["puede_editar"],
  );

  if (!autorizado) {
    redirect("/gestion");
  }

  const { id } = await params;
  const query = await searchParams;

  if (!/^\d+$/.test(id)) notFound();

  const { data: empresa } = await supabase
    .from("empresas")
    .select(
      `
        id,
        nombre,
        razon_social,
        activa,
        rama,
        domicilio,
        localidad,
        provincia,
        codigo_postal,
        cuit,
        correo_electronico,
        telefono
        ,provincia_id
        ,departamento_id
        ,localidad_id
      `,
    )
    .eq("id", Number(id))
    .maybeSingle();

  if (!empresa) notFound();

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
            <h1>Editar empresa</h1>
            <p>{empresa.nombre}</p>
          </div>

          <span
            className={
              empresa.activa
                ? "company-state active"
                : "company-state inactive"
            }
          >
            {empresa.activa ? "ACTIVA" : "INACTIVA"}
          </span>
        </header>

        {query.error === "nombre" && (
          <div className="form-message error">
            El nombre de la empresa es obligatorio.
          </div>
        )}

        {query.error === "duplicada" && (
          <div className="form-message error">
            Ya existe otra empresa con ese nombre.
          </div>
        )}

        {query.error === "guardado" && (
          <div className="form-message error">
            No fue posible guardar los cambios.
          </div>
        )}

        <form
          action={actualizarEmpresa}
          className="company-form"
        >
          <input type="hidden" name="id" value={empresa.id} />

          <div className="company-form-grid">
            <label>
              <span>Nombre para mostrar *</span>
              <input
                name="nombre"
                defaultValue={empresa.nombre}
                required
              />
            </label>

            <label>
              <span>Razón social</span>
              <input
                name="razon_social"
                defaultValue={empresa.razon_social || ""}
              />
            </label>

            <label>
              <span>CUIT</span>
              <input
                name="cuit"
                defaultValue={empresa.cuit || ""}
              />
            </label>

            <label>
              <span>Rama o convenio</span>
              <input
                name="rama"
                defaultValue={empresa.rama || ""}
              />
            </label>

            <label className="full">
              <span>Domicilio</span>
              <input
                name="domicilio"
                defaultValue={empresa.domicilio || ""}
              />
            </label>

            <TerritoryFields
              provincias={provincias||[]}
              departamentos={departamentos||[]}
              localidades={localidades||[]}
              inicial={{
                provincia_id:empresa.provincia_id,
                departamento_id:empresa.departamento_id,
                localidad_id:empresa.localidad_id,
                provincia:empresa.provincia,
                localidad:empresa.localidad,
                codigo_postal:empresa.codigo_postal,
              }}
            />

            <label>
              <span>Teléfono</span>
              <input
                name="telefono"
                type="tel"
                defaultValue={empresa.telefono || ""}
              />
            </label>

            <label className="full">
              <span>Correo electrónico</span>
              <input
                name="correo_electronico"
                type="email"
                defaultValue={
                  empresa.correo_electronico || ""
                }
              />
            </label>

            <label className="company-active-field full">
              <input
                name="activa"
                type="checkbox"
                defaultChecked={empresa.activa !== false}
              />
              <span>Empresa activa</span>
            </label>
          </div>

          <div className="affiliate-edit-actions">
            <Link href="/gestion/sistema/empresas">
              Cancelar
            </Link>
            <button type="submit">
              Guardar cambios
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
