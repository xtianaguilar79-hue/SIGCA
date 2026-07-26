import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";
import {
  actualizarProvincia,
  crearProvincia,
} from "./actions";

export default async function ProvinciasPage({
  searchParams,
}: {
  searchParams: Promise<{
    creada?: string;
    actualizada?: string;
    error?: string;
  }>;
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

  const { data: provincias } = await supabase
    .from("provincias")
    .select("id,nombre,orden,habilitada")
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });

  const params = await searchParams;
  const name = [profile.nombre, profile.apellido]
    .filter(Boolean)
    .join(" ");
  const habilitadas = (provincias || []).filter(
    (provincia) => provincia.habilitada,
  ).length;

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
          <strong>{name}</strong>
          <span>Administrador</span>
          <SignOutButton />
        </div>
      </aside>

      <section className="main-area affiliate-states-page">
        <Link
          className="library-back"
          href="/gestion/sistema/configuracion"
        >
          ← Volver a Configuración
        </Link>

        <header className="main-head">
          <div>
            <p className="kicker">
              CONFIGURACIÓN · TERRITORIO
            </p>
            <h1>Provincias</h1>
            <p>
              Catálogo territorial utilizado en afiliados,
              empresas y formularios institucionales.
            </p>
          </div>
          <span className="secure">
            ● CATÁLOGO INSTITUCIONAL
          </span>
        </header>

        {params.creada === "1" && (
          <div className="form-message success">
            Provincia creada correctamente.
          </div>
        )}
        {params.actualizada === "1" && (
          <div className="form-message success">
            Provincia actualizada correctamente.
          </div>
        )}
        {params.error && (
          <div className="form-message error">
            No fue posible guardar el cambio.
          </div>
        )}

        <div className="affiliate-states-summary">
          <article>
            <strong>{(provincias || []).length}</strong>
            <span>Jurisdicciones registradas</span>
          </article>
          <article>
            <strong>{habilitadas}</strong>
            <span>Jurisdicciones habilitadas</span>
          </article>
          <article>
            <strong>
              {(provincias || []).length - habilitadas}
            </strong>
            <span>Jurisdicciones deshabilitadas</span>
          </article>
        </div>

        <details className="affiliate-state-create">
          <summary>＋ Agregar provincia o jurisdicción</summary>
          <form action={crearProvincia}>
            <label>
              <span>Nombre</span>
              <input name="nombre" required minLength={3} />
            </label>
            <label>
              <span>Orden</span>
              <input
                name="orden"
                type="number"
                min={0}
                required
              />
            </label>
            <button type="submit">Guardar provincia</button>
          </form>
        </details>

        <section className="affiliate-state-list">
          <div className="section-heading">
            <div>
              <p className="kicker">ARGENTINA</p>
              <h2>Catálogo de provincias</h2>
            </div>
          </div>

          {(provincias || []).map((provincia) => (
            <article key={provincia.id}>
              <header>
                <div>
                  <h3>{provincia.nombre}</h3>
                  <span
                    className={
                      provincia.habilitada
                        ? "active"
                        : "inactive"
                    }
                  >
                    {provincia.habilitada
                      ? "HABILITADA"
                      : "DESHABILITADA"}
                  </span>
                </div>
              </header>

              <form action={actualizarProvincia}>
                <input
                  type="hidden"
                  name="id"
                  value={provincia.id}
                />
                <label>
                  <span>Orden</span>
                  <input
                    name="orden"
                    type="number"
                    min={0}
                    defaultValue={provincia.orden}
                    required
                  />
                </label>
                <label>
                  <span>Disponibilidad</span>
                  <select
                    name="habilitada"
                    defaultValue={String(
                      provincia.habilitada,
                    )}
                  >
                    <option value="true">Habilitada</option>
                    <option value="false">
                      Deshabilitada
                    </option>
                  </select>
                </label>
                <button type="submit">
                  Guardar cambios
                </button>
              </form>
            </article>
          ))}
        </section>

        <p className="affiliate-states-note">
          Las provincias no se eliminan porque pueden estar
          relacionadas con datos históricos. Si dejan de
          utilizarse, se deshabilitan.
        </p>
      </section>
    </main>
  );
}
