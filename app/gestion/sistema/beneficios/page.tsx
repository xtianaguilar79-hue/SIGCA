import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";
import { cambiarEstadoBeneficio, crearBeneficio } from "./actions";

function mostrarFecha(valor: string | null) {
  if (!valor) return "Sin límite";
  const [anio, mes, dia] = valor.slice(0, 10).split("-");
  return `${dia}/${mes}/${anio}`;
}

export default async function BeneficiosPage({
  searchParams,
}: {
  searchParams: Promise<{ creado?: string; error?: string }>;
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

  const [{ data: beneficios }, { data: lugares }] = await Promise.all([
    supabase
      .from("beneficios")
      .select("id,nombre,descripcion,fecha_inicio,fecha_fin,stock,activo")
      .order("activo", { ascending: false })
      .order("nombre", { ascending: true }),
    supabase
      .from("beneficios_lugares_entrega")
      .select("id,nombre,activo")
      .eq("activo", true)
      .order("nombre", { ascending: true }),
  ]);

  const params = await searchParams;
  const name = [profile.nombre, profile.apellido].filter(Boolean).join(" ");
  const activos = (beneficios || []).filter((item) => item.activo).length;

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
          <Link className="active" href="/gestion/sistema">Sistema</Link>
          <Link href="/gestion/usuarios">Administración de usuarios</Link>
        </nav>
        <div className="session">
          <strong>{name}</strong>
          <span>Administrador</span>
          <SignOutButton />
        </div>
      </aside>

      <section className="main-area benefits-page">
        <Link className="library-back" href="/gestion/sistema">
          ← Volver a Sistema
        </Link>

        <header className="main-head">
          <div>
            <p className="kicker">SISTEMA · BENEFICIOS</p>
            <h1>Beneficios</h1>
            <p>Administrá el catálogo y prepará las entregas a afiliados.</p>
          </div>
          <span className="secure">● ACCESO ADMINISTRATIVO</span>
        </header>

        {params.creado === "1" && (
          <div className="form-message success">Beneficio creado correctamente.</div>
        )}
        {params.error && (
          <div className="form-message error">
            No fue posible guardar el beneficio. Revisá los datos.
          </div>
        )}

        <div className="benefits-summary">
          <article>
            <strong>{(beneficios || []).length}</strong>
            <span>Beneficios registrados</span>
          </article>
          <article>
            <strong>{activos}</strong>
            <span>Beneficios activos</span>
          </article>
          <article>
            <strong>{(lugares || []).length}</strong>
            <span>Lugares de entrega</span>
          </article>
        </div>

        <div className="benefits-primary-actions">
          <Link href="/gestion/sistema/beneficios/entregar">
            Entregar un beneficio
          </Link>
        </div>

        <details className="benefit-create">
          <summary>＋ Crear nuevo beneficio</summary>
          <form action={crearBeneficio}>
            <label>
              <span>Nombre del beneficio</span>
              <input name="nombre" required minLength={3} />
            </label>
            <label className="benefit-description">
              <span>Descripción</span>
              <textarea name="descripcion" rows={3} />
            </label>
            <label>
              <span>Fecha de inicio</span>
              <input name="fecha_inicio" type="date" />
            </label>
            <label>
              <span>Fecha de finalización</span>
              <input name="fecha_fin" type="date" />
            </label>
            <label>
              <span>Stock inicial</span>
              <input
                name="stock"
                type="number"
                min={0}
                placeholder="Vacío = sin control de stock"
              />
            </label>
            <button type="submit">Guardar beneficio</button>
          </form>
        </details>

        <section className="delivery-places">
          <div>
            <p className="kicker">LUGARES DISPONIBLES</p>
            <h2>Lugares de entrega</h2>
          </div>
          <div>
            {(lugares || []).map((lugar) => (
              <span key={lugar.id}>{lugar.nombre}</span>
            ))}
          </div>
        </section>

        <section className="benefit-catalog">
          <div className="section-heading">
            <div>
              <p className="kicker">CATÁLOGO</p>
              <h2>Beneficios registrados</h2>
            </div>
            <span>{(beneficios || []).length} beneficios</span>
          </div>

          <div className="benefit-list">
            {(beneficios || []).map((beneficio) => (
              <article className="benefit-card" key={beneficio.id}>
                <header>
                  <div>
                    <h3>{beneficio.nombre}</h3>
                    <span className={beneficio.activo ? "active" : "inactive"}>
                      {beneficio.activo ? "ACTIVO" : "INACTIVO"}
                    </span>
                  </div>
                  <p>{beneficio.descripcion || "Sin descripción."}</p>
                </header>

                <dl>
                  <div>
                    <dt>Vigencia</dt>
                    <dd>
                      {mostrarFecha(beneficio.fecha_inicio)} —{" "}
                      {mostrarFecha(beneficio.fecha_fin)}
                    </dd>
                  </div>
                  <div>
                    <dt>Stock</dt>
                    <dd>
                      {beneficio.stock === null
                        ? "Sin control"
                        : beneficio.stock.toLocaleString("es-AR")}
                    </dd>
                  </div>
                </dl>

                <form action={cambiarEstadoBeneficio}>
                  <input type="hidden" name="id" value={beneficio.id} />
                  <input
                    type="hidden"
                    name="activo"
                    value={String(beneficio.activo)}
                  />
                  <button type="submit">
                    {beneficio.activo ? "Desactivar" : "Volver a activar"}
                  </button>
                </form>
              </article>
            ))}

            {(beneficios || []).length === 0 && (
              <div className="benefits-empty">
                Todavía no hay beneficios registrados.
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
