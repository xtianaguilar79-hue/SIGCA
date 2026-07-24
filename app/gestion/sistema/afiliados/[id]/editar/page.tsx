import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";
import { actualizarAfiliado } from "./actions";

export default async function EditarAfiliadoPage({
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
    String(profile.estado).toLowerCase() !== "aprobado" ||
    String(profile.rol).toLowerCase() !== "administrador"
  ) {
    redirect("/gestion");
  }

  const { id } = await params;
  const query = await searchParams;

  const { data: afiliado } = await supabase
    .from("afiliados")
    .select(
      `
        id,
        numero_aoma,
        apellido_nombres,
        documento_numero,
        cuil,
        fecha_nacimiento,
        direccion,
        codigo_postal,
        provincia,
        departamento,
        telefono_fijo,
        telefono_movil,
        email
      `,
    )
    .eq("id", id)
    .maybeSingle();

  if (!afiliado) {
    notFound();
  }

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

      <section className="main-area affiliate-edit-page">
        <Link
          className="library-back"
          href={`/gestion/sistema/afiliados/${id}`}
        >
          ← Volver a la ficha
        </Link>

        <header className="main-head">
          <div>
            <p className="kicker">ACTUALIZACIÓN DEL PADRÓN</p>
            <h1>Editar datos personales</h1>
            <p>{afiliado.apellido_nombres}</p>
          </div>

          <span className="secure">
            AOMA {afiliado.numero_aoma || "SIN INFORMAR"}
          </span>
        </header>

        {query.error === "correo" && (
          <div className="form-message error">
            El correo electrónico no tiene un formato válido.
          </div>
        )}

        {query.error === "guardado" && (
          <div className="form-message error">
            No fue posible guardar los cambios.
          </div>
        )}

        <form
          action={actualizarAfiliado}
          className="affiliate-edit-form"
        >
          <input type="hidden" name="id" value={id} />

          <div className="affiliate-protected-data">
            <div>
              <span>DNI</span>
              <strong>
                {afiliado.documento_numero || "Sin informar"}
              </strong>
            </div>
            <div>
              <span>CUIL</span>
              <strong>{afiliado.cuil || "Sin informar"}</strong>
            </div>
            <div>
              <span>Número AOMA</span>
              <strong>
                {afiliado.numero_aoma || "Sin informar"}
              </strong>
            </div>
          </div>

          <div className="affiliate-edit-grid">
            <label className="full">
              <span>Apellido y nombres</span>
              <input
                name="apellido_nombres"
                defaultValue={afiliado.apellido_nombres || ""}
                required
              />
            </label>

            <label>
              <span>Fecha de nacimiento</span>
              <input
                name="fecha_nacimiento"
                type="date"
                defaultValue={
                  afiliado.fecha_nacimiento?.slice(0, 10) || ""
                }
              />
            </label>

            <label>
              <span>Código postal</span>
              <input
                name="codigo_postal"
                defaultValue={afiliado.codigo_postal || ""}
              />
            </label>

            <label className="full">
              <span>Dirección</span>
              <input
                name="direccion"
                defaultValue={afiliado.direccion || ""}
              />
            </label>

            <label>
              <span>Provincia</span>
              <input
                name="provincia"
                defaultValue={afiliado.provincia || ""}
              />
            </label>

            <label>
              <span>Departamento</span>
              <input
                name="departamento"
                defaultValue={afiliado.departamento || ""}
              />
            </label>

            <label>
              <span>Teléfono móvil</span>
              <input
                name="telefono_movil"
                type="tel"
                defaultValue={afiliado.telefono_movil || ""}
              />
            </label>

            <label>
              <span>Teléfono fijo</span>
              <input
                name="telefono_fijo"
                type="tel"
                defaultValue={afiliado.telefono_fijo || ""}
              />
            </label>

            <label className="full">
              <span>Correo electrónico</span>
              <input
                name="email"
                type="email"
                defaultValue={afiliado.email || ""}
              />
            </label>
          </div>

          <div className="affiliate-edit-actions">
            <Link
              href={`/gestion/sistema/afiliados/${id}`}
            >
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
