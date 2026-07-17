import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";

type Empresa = {
  id: string | number;
  nombre: string;
};

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
    .select(
      "nombre,apellido,dni,telefono,mail,fecha_nacimiento,rol,estado,activo"
    )
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

  const { data: companyRows } = await supabase
    .from("empresas")
    .select("id,nombre")
    .eq("activa", true)
    .order("nombre");

  const companies =
    (companyRows ?? []) as Empresa[];

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
              Seleccioná la empresa y verificá los datos
              personales antes de preparar la ficha.
            </p>
          </div>
        </header>

        <section className="form-shell wide">
          <form className="registration-grid">
            <div className="field full">
              <label htmlFor="empresa">
                Empresa
              </label>

              <select
                id="empresa"
                name="empresa"
                required
                defaultValue=""
              >
                <option value="" disabled>
                  Seleccionar una empresa
                </option>

                {companies.map((company) => (
                  <option
                    key={company.id}
                    value={company.id}
                  >
                    {company.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="nombre">
                Nombre
              </label>

              <input
                id="nombre"
                name="nombre"
                defaultValue={profile.nombre || ""}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="apellido">
                Apellido
              </label>

              <input
                id="apellido"
                name="apellido"
                defaultValue={profile.apellido || ""}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="dni">
                DNI
              </label>

              <input
                id="dni"
                name="dni"
                defaultValue={profile.dni || ""}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="fecha_nacimiento">
                Fecha de nacimiento
              </label>

              <input
                id="fecha_nacimiento"
                name="fecha_nacimiento"
                type="date"
                defaultValue={
                  profile.fecha_nacimiento || ""
                }
                required
              />
            </div>

            <div className="field">
              <label htmlFor="telefono">
                Teléfono
              </label>

              <input
                id="telefono"
                name="telefono"
                defaultValue={profile.telefono || ""}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="email">
                Correo electrónico
              </label>

              <input
                id="email"
                name="email"
                type="email"
                defaultValue={profile.mail || ""}
                required
              />
            </div>

            <div className="form-message warning full">
              En esta primera etapa verificamos la empresa
              y los datos personales. En el próximo paso
              incorporaremos los datos del empleador y la
              generación de la ficha oficial.
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}
