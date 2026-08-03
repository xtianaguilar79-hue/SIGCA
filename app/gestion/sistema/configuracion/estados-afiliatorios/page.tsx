import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";
import {
  actualizarEstadoAfiliatorio,
  crearEstadoAfiliatorio,
} from "./actions";

export default async function EstadosAfiliatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{
    creado?: string;
    actualizado?: string;
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

  const { data: estados } = await supabase
    .from("estados_afiliado")
    .select("nombre,descripcion,orden,habilitado")
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });

  const params = await searchParams;
  const name = [profile.nombre, profile.apellido]
    .filter(Boolean)
    .join(" ");
  const habilitados = (estados || []).filter(
    (estado) => estado.habilitado,
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
          href="/gestion/sistema"
        >
          ← Volver a Sistema
        </Link>

        <header className="main-head">
          <div>
            <p className="kicker">
              CONFIGURACIÓN · PADRÓN
            </p>
            <h1>Estados afiliatorios</h1>
            <p>
              Administrá las situaciones utilizadas en el
              padrón, las fichas y los reportes.
            </p>
          </div>
          <span className="secure">
            ● ACCESO ADMINISTRATIVO
          </span>
        </header>

        {params.creado === "1" && (
          <div className="form-message success">
            Estado creado correctamente.
          </div>
        )}
        {params.actualizado === "1" && (
          <div className="form-message success">
            Estado actualizado correctamente.
          </div>
        )}
        {params.error && (
          <div className="form-message error">
            No fue posible guardar el cambio. Revisá los
            datos y verificá que el nombre no esté repetido.
          </div>
        )}

        <div className="affiliate-states-summary">
          <article>
            <strong>{(estados || []).length}</strong>
            <span>Estados registrados</span>
          </article>
          <article>
            <strong>{habilitados}</strong>
            <span>Estados habilitados</span>
          </article>
          <article>
            <strong>
              {(estados || []).length - habilitados}
            </strong>
            <span>Estados deshabilitados</span>
          </article>
        </div>

        <details className="affiliate-state-create">
          <summary>＋ Crear estado afiliatorio</summary>
          <form action={crearEstadoAfiliatorio}>
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
            <label className="state-description">
              <span>Descripción</span>
              <textarea name="descripcion" rows={3} />
            </label>
            <button type="submit">Guardar estado</button>
          </form>
        </details>

        <section className="affiliate-state-list">
          <div className="section-heading">
            <div>
              <p className="kicker">ESTADOS</p>
              <h2>Configuración actual</h2>
            </div>
          </div>

          {(estados || []).map((estado) => (
            <article key={estado.nombre}>
              <header>
                <div>
                  <h3>{estado.nombre}</h3>
                  <span
                    className={
                      estado.habilitado
                        ? "active"
                        : "inactive"
                    }
                  >
                    {estado.habilitado
                      ? "HABILITADO"
                      : "DESHABILITADO"}
                  </span>
                </div>
              </header>

              <form action={actualizarEstadoAfiliatorio}>
                <input
                  type="hidden"
                  name="nombre"
                  value={estado.nombre}
                />
                <label>
                  <span>Orden</span>
                  <input
                    name="orden"
                    type="number"
                    min={0}
                    defaultValue={estado.orden}
                    required
                  />
                </label>
                <label className="state-description">
                  <span>Descripción</span>
                  <textarea
                    name="descripcion"
                    rows={2}
                    defaultValue={estado.descripcion || ""}
                  />
                </label>
                <label>
                  <span>Disponibilidad</span>
                  <select
                    name="habilitado"
                    defaultValue={String(estado.habilitado)}
                  >
                    <option value="true">Habilitado</option>
                    <option value="false">
                      Deshabilitado
                    </option>
                  </select>
                </label>
                <button type="submit">Guardar cambios</button>
              </form>
            </article>
          ))}
        </section>

        <p className="affiliate-states-note">
          Los estados no se eliminan porque forman parte del
          historial institucional. Cuando ya no deben utilizarse,
          se deshabilitan.
        </p>
      </section>
    </main>
  );
}
