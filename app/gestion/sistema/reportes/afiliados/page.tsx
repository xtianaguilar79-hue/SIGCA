import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";

export default async function ReporteGeneralAfiliadosPage() {
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
    .select("nombre")
    .eq("habilitado", true)
    .order("orden");

  const [
    { count: total },
    { count: vinculados },
    { count: conCorreo },
    cantidadesPorEstado,
  ] = await Promise.all([
    supabase
      .from("afiliados")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("afiliados")
      .select("id", { count: "exact", head: true })
      .not("empresa_id", "is", null),
    supabase
      .from("afiliados")
      .select("id", { count: "exact", head: true })
      .not("email", "is", null)
      .neq("email", ""),
    Promise.all(
      (estados || []).map(async ({ nombre }) => {
        const { count } = await supabase
          .from("afiliados")
          .select("id", { count: "exact", head: true })
          .eq("estado", nombre);
        return { nombre, cantidad: count || 0 };
      }),
    ),
  ]);

  const totalPadron = total || 0;
  const estadosOrdenados = cantidadesPorEstado.sort(
    (a, b) => b.cantidad - a.cantidad,
  );
  const name = [profile.nombre, profile.apellido]
    .filter(Boolean)
    .join(" ");

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

      <section className="main-area reports-page">
        <Link className="library-back" href="/gestion/sistema/reportes">
          ← Volver a Reportes
        </Link>

        <header className="main-head">
          <div>
            <p className="kicker">REPORTES · PADRÓN</p>
            <h1>General de afiliados</h1>
            <p>
              Resumen actualizado de personas, vinculación empresarial y
              estados afiliatorios.
            </p>
          </div>
          <span className="secure">DATOS ACTUALIZADOS</span>
        </header>

        <div className="report-summary">
          <article>
            <span>PADRÓN TOTAL</span>
            <strong>{totalPadron.toLocaleString("es-AR")}</strong>
            <p>Personas registradas</p>
          </article>
          <article>
            <span>EMPRESA VINCULADA</span>
            <strong>{(vinculados || 0).toLocaleString("es-AR")}</strong>
            <p>
              {totalPadron
                ? Math.round(((vinculados || 0) / totalPadron) * 100)
                : 0}
              % del padrón
            </p>
          </article>
          <article>
            <span>CORREO INFORMADO</span>
            <strong>{(conCorreo || 0).toLocaleString("es-AR")}</strong>
            <p>
              {totalPadron
                ? Math.round(((conCorreo || 0) / totalPadron) * 100)
                : 0}
              % del padrón
            </p>
          </article>
        </div>

        <div className="report-builder-access">
          <div>
            <strong>Generar un listado personalizado</strong>
            <span>
              Seleccioná un estado, una empresa o combiná ambos filtros.
            </span>
          </div>
          <Link href="/gestion/sistema/reportes/generador">
            Preparar reporte →
          </Link>
        </div>

        <section className="affiliate-state-report">
          <div className="affiliate-state-report-heading">
            <div>
              <p className="kicker">DISTRIBUCIÓN</p>
              <h2>Personas por estado</h2>
            </div>
            <span>{estadosOrdenados.length} ESTADOS</span>
          </div>

          <div className="affiliate-state-list">
            {estadosOrdenados.map((item) => {
              const porcentaje = totalPadron
                ? (item.cantidad / totalPadron) * 100
                : 0;

              return (
                <Link
                  href={`/gestion/sistema/afiliados?estado=${encodeURIComponent(
                    item.nombre,
                  )}`}
                  key={item.nombre}
                >
                  <div className="affiliate-state-data">
                    <strong>{item.nombre}</strong>
                    <span>{porcentaje.toFixed(1)}% del padrón</span>
                  </div>
                  <div className="affiliate-state-bar" aria-hidden="true">
                    <i style={{ width: `${Math.max(porcentaje, 0.5)}%` }} />
                  </div>
                  <b>{item.cantidad.toLocaleString("es-AR")}</b>
                </Link>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}
