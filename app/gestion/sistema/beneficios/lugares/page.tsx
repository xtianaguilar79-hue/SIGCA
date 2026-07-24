import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";
import { cambiarEstadoLugar, crearLugarEntrega } from "./actions";

export default async function LugaresEntregaPage({
  searchParams,
}: {
  searchParams: Promise<{
    creado?: string;
    reactivado?: string;
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

  const { data: lugares } = await supabase
    .from("beneficios_lugares_entrega")
    .select("id,nombre,activo,created_at")
    .order("activo", { ascending: false })
    .order("nombre", { ascending: true });

  const params = await searchParams;
  const name = [profile.nombre, profile.apellido].filter(Boolean).join(" ");
  const activos = (lugares || []).filter((lugar) => lugar.activo).length;

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
          <Link className="active" href="/gestion/sistema">
            Sistema
          </Link>
          <Link href="/gestion/usuarios">Administración de usuarios</Link>
        </nav>

        <div className="session">
          <strong>{name}</strong>
          <span>Administrador</span>
          <SignOutButton />
        </div>
      </aside>

      <section className="main-area benefit-places-page">
        <Link className="library-back" href="/gestion/sistema/beneficios">
          ← Volver a Beneficios
        </Link>

        <header className="main-head">
          <div>
            <p className="kicker">SISTEMA · BENEFICIOS</p>
            <h1>Lugares de entrega</h1>
            <p>
              Administrá las sedes habilitadas para registrar entregas de
              beneficios.
            </p>
          </div>
          <span className="secure">● ACCESO ADMINISTRATIVO</span>
        </header>

        {params.creado === "1" && (
          <div className="form-message success">
            Lugar de entrega creado correctamente.
          </div>
        )}
        {params.reactivado === "1" && (
          <div className="form-message success">
            El lugar existente fue reactivado.
          </div>
        )}
        {params.error && (
          <div className="form-message error">
            {params.error === "duplicado"
              ? "Ese lugar de entrega ya existe."
              : "No fue posible guardar el cambio. Revisá los datos."}
          </div>
        )}

        <div className="benefit-places-summary">
          <article>
            <strong>{(lugares || []).length}</strong>
            <span>Lugares registrados</span>
          </article>
          <article>
            <strong>{activos}</strong>
            <span>Lugares activos</span>
          </article>
          <article>
            <strong>{(lugares || []).length - activos}</strong>
            <span>Lugares inactivos</span>
          </article>
        </div>

        <section className="benefit-place-create">
          <div>
            <p className="kicker">NUEVO LUGAR</p>
            <h2>Agregar lugar de entrega</h2>
            <p>
              El nombre se guardará en mayúsculas. Si ya existía pero estaba
              inactivo, SIGCA lo reactivará sin duplicarlo.
            </p>
          </div>

          <form action={crearLugarEntrega}>
            <label>
              <span>Nombre del lugar</span>
              <input
                name="nombre"
                required
                minLength={2}
                placeholder="Ej.: VALLE FÉRTIL"
              />
            </label>
            <button type="submit">Guardar lugar</button>
          </form>
        </section>

        <section className="benefit-places-list">
          <div className="section-heading">
            <div>
              <p className="kicker">SEDES</p>
              <h2>Lugares registrados</h2>
            </div>
          </div>

          <div className="benefit-place-grid">
            {(lugares || []).map((lugar) => (
              <article className="benefit-place-card" key={lugar.id}>
                <div>
                  <h3>{lugar.nombre}</h3>
                  <span className={lugar.activo ? "active" : "inactive"}>
                    {lugar.activo ? "ACTIVO" : "INACTIVO"}
                  </span>
                </div>

                <form action={cambiarEstadoLugar}>
                  <input type="hidden" name="id" value={lugar.id} />
                  <input
                    type="hidden"
                    name="activo"
                    value={String(lugar.activo)}
                  />
                  <button type="submit">
                    {lugar.activo ? "Desactivar" : "Volver a activar"}
                  </button>
                </form>
              </article>
            ))}
          </div>
        </section>

        <p className="benefit-places-note">
          Los lugares no se eliminan: se desactivan para conservar correctamente
          el historial de entregas.
        </p>
      </section>
    </main>
  );
}
