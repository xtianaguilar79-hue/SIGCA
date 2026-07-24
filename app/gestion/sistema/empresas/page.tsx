import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CompanyFilters } from "@/components/company-filters";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";

const REGISTROS_POR_PAGINA = 25;

export default async function EmpresasPage({
  searchParams,
}: {
  searchParams: Promise<{
    buscar?: string;
    estado?: string;
    pagina?: string;
    empresa_creada?: string;
    empresa_actualizada?: string;
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

  const params = await searchParams;

  const buscar = String(params.buscar || "")
    .trim()
    .replace(/[,%()_*]/g, " ")
    .slice(0, 80);

  const estado = ["activas", "inactivas", "todas"].includes(
    String(params.estado),
  )
    ? String(params.estado)
    : "activas";

  const paginaSolicitada = Number(params.pagina || "1");
  const pagina =
    Number.isInteger(paginaSolicitada) && paginaSolicitada > 0
      ? paginaSolicitada
      : 1;

  const desde = (pagina - 1) * REGISTROS_POR_PAGINA;
  const hasta = desde + REGISTROS_POR_PAGINA - 1;

  let consulta = supabase
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
      { count: "exact" },
    )
    .order("nombre", { ascending: true })
    .range(desde, hasta);

  if (estado === "activas") {
    consulta = consulta.eq("activa", true);
  }

  if (estado === "inactivas") {
    consulta = consulta.eq("activa", false);
  }

  if (buscar) {
    consulta = consulta.or(
      [
        `nombre.ilike.%${buscar}%`,
        `razon_social.ilike.%${buscar}%`,
        `cuit.ilike.%${buscar}%`,
      ].join(","),
    );
  }

  const { data: empresas, count, error } = await consulta;

  const total = count || 0;
  const totalPaginas = Math.max(
    1,
    Math.ceil(total / REGISTROS_POR_PAGINA),
  );

  const nombreUsuario = [
    profile.nombre,
    profile.apellido,
  ]
    .filter(Boolean)
    .join(" ");

  function enlacePagina(numero: number) {
    const query = new URLSearchParams();

    if (buscar) query.set("buscar", buscar);
    query.set("estado", estado);
    query.set("pagina", String(numero));

    return `/gestion/sistema/empresas?${query.toString()}`;
  }

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

      <section className="main-area companies-page">
        <Link
          className="library-back"
          href="/gestion/sistema"
        >
          ← Volver a Sistema
        </Link>

        <header className="main-head">
          <div>
            <p className="kicker">SISTEMA · EMPRESAS</p>
            <h1>Empresas</h1>
            <p>
              Consulta y administración de los datos
              institucionales de cada empleador.
            </p>
          </div>

          <span className="secure">
            {total.toLocaleString("es-AR")} EMPRESAS
          </span>
        </header>

        <CompanyFilters buscar={buscar} estado={estado} />

        {params.empresa_creada === "1" && (
          <div className="form-message success">
            La empresa fue creada correctamente.
          </div>
        )}

        {params.empresa_actualizada === "1" && (
          <div className="form-message success">
            Los datos de la empresa fueron actualizados.
          </div>
        )}

        <div className="company-page-actions">
          <Link href="/gestion/sistema/empresas/nueva">
            ＋ Nueva empresa
          </Link>
        </div>

        {error ? (
          <div className="form-message error">
            No fue posible consultar las empresas.
          </div>
        ) : (
          <>
            <div className="companies-list">
              {empresas?.map((empresa) => (
                <article
                  className="company-card"
                  key={empresa.id}
                >
                  <header>
                    <div>
                      <h2>{empresa.nombre}</h2>
                      <p>
                        {empresa.razon_social ||
                          "Razón social sin informar"}
                      </p>
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

                  <dl>
                    <div>
                      <dt>CUIT</dt>
                      <dd>{empresa.cuit || "Sin informar"}</dd>
                    </div>
                    <div>
                      <dt>Rama</dt>
                      <dd>{empresa.rama || "Sin informar"}</dd>
                    </div>
                    <div>
                      <dt>Localidad</dt>
                      <dd>
                        {[empresa.localidad, empresa.provincia]
                          .filter(Boolean)
                          .join(", ") || "Sin informar"}
                      </dd>
                    </div>
                    <div>
                      <dt>Teléfono</dt>
                      <dd>
                        {empresa.telefono || "Sin informar"}
                      </dd>
                    </div>
                    <div>
                      <dt>Correo electrónico</dt>
                      <dd>
                        {empresa.correo_electronico ||
                          "Sin informar"}
                      </dd>
                    </div>
                  </dl>

                  <div className="company-card-actions">
                    <Link
                      href={`/gestion/sistema/empresas/${empresa.id}/editar`}
                    >
                      Editar empresa
                    </Link>
                  </div>
                </article>
              ))}

              {!empresas?.length && (
                <div className="empty-users">
                  No se encontraron empresas.
                </div>
              )}
            </div>

            {totalPaginas > 1 && (
              <nav
                className="affiliate-pagination"
                aria-label="Páginas de empresas"
              >
                {pagina > 1 ? (
                  <Link href={enlacePagina(pagina - 1)}>
                    ‹ Anterior
                  </Link>
                ) : (
                  <span>‹ Anterior</span>
                )}

                <strong>
                  Página {pagina} de {totalPaginas}
                </strong>

                {pagina < totalPaginas ? (
                  <Link href={enlacePagina(pagina + 1)}>
                    Siguiente ›
                  </Link>
                ) : (
                  <span>Siguiente ›</span>
                )}
              </nav>
            )}
          </>
        )}
      </section>
    </main>
  );
}
