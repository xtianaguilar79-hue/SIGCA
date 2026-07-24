import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";
import { actualizarEmpresa } from "../../actions";

const PROVINCIAS = [
  "BUENOS AIRES",
  "CATAMARCA",
  "CHACO",
  "CHUBUT",
  "CIUDAD AUTÓNOMA DE BUENOS AIRES",
  "CÓRDOBA",
  "CORRIENTES",
  "ENTRE RÍOS",
  "FORMOSA",
  "JUJUY",
  "LA PAMPA",
  "LA RIOJA",
  "MENDOZA",
  "MISIONES",
  "NEUQUÉN",
  "RÍO NEGRO",
  "SALTA",
  "SAN JUAN",
  "SAN LUIS",
  "SANTA CRUZ",
  "SANTA FE",
  "SANTIAGO DEL ESTERO",
  "TIERRA DEL FUEGO",
  "TUCUMÁN",
];

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
    String(profile.estado).toLowerCase() !== "aprobado" ||
    String(profile.rol).toLowerCase() !== "administrador"
  ) {
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
      `,
    )
    .eq("id", Number(id))
    .maybeSingle();

  if (!empresa) notFound();

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

            <label>
              <span>Provincia</span>
              <select
                name="provincia"
                defaultValue={empresa.provincia || "SAN JUAN"}
              >
                {!PROVINCIAS.includes(
                  empresa.provincia || "",
                ) &&
                  empresa.provincia && (
                    <option value={empresa.provincia}>
                      {empresa.provincia}
                    </option>
                  )}

                {PROVINCIAS.map((provincia) => (
                  <option
                    key={provincia}
                    value={provincia}
                  >
                    {provincia}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Localidad</span>
              <input
                name="localidad"
                defaultValue={empresa.localidad || ""}
              />
            </label>

            <label>
              <span>Código postal</span>
              <input
                name="codigo_postal"
                defaultValue={empresa.codigo_postal || ""}
              />
            </label>

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
