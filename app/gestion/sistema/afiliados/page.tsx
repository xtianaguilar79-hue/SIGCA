import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";

const REGISTROS_POR_PAGINA = 25;

export default async function PadronAfiliadosPage({
  searchParams,
}: {
  searchParams: Promise<{
  buscar?: string;
  estado?: string;
  empresa?: string;
  pagina?: string;
}>;
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
    String(profile.estado).toLowerCase() !== "aprobado"
  ) {
    redirect("/acceso");
  }

  const isAdmin =
    String(profile.rol).toLowerCase() === "administrador";

  if (!isAdmin) {
    redirect("/gestion/sistema");
  }

  const params = await searchParams;
  const estadoSeleccionado = String(
  params.estado || "",
).trim();

const empresaSeleccionada = String(
  params.empresa || "",
).trim();

const [estadosResult, empresasResult] =
  await Promise.all([
    supabase
      .from("estados_afiliado")
      .select("nombre")
      .eq("habilitado", true)
      .order("orden"),

    supabase
      .from("empresas")
      .select("id,nombre")
      .eq("activa", true)
      .order("nombre"),
  ]);

const estados = estadosResult.data || [];
const empresas = empresasResult.data || [];

  const buscar = String(params.buscar || "")
    .trim()
    .replace(/[,%()_*]/g, " ")
    .slice(0, 80);

  const paginaSolicitada = Number(params.pagina || "1");

  const pagina =
    Number.isInteger(paginaSolicitada) && paginaSolicitada > 0
      ? paginaSolicitada
      : 1;

  const desde = (pagina - 1) * REGISTROS_POR_PAGINA;
  const hasta = desde + REGISTROS_POR_PAGINA - 1;

  let consulta = supabase
    .from("afiliados")
    .select(
      `
        id,
        numero_aoma,
        apellido_nombres,
        documento_numero,
        cuil,
        empresa_original,
        estado,
        telefono_movil,
        email
      `,
      { count: "exact" },
    )
    .order("apellido_nombres", { ascending: true })
    .range(desde, hasta);

  if (buscar) {
    consulta = consulta.or(
      [
        `apellido_nombres.ilike.%${buscar}%`,
        `documento_numero.ilike.%${buscar}%`,
        `cuil.ilike.%${buscar}%`,
        `numero_aoma.ilike.%${buscar}%`,
      ].join(","),
    );
  }
if (estadoSeleccionado) {
  consulta = consulta.eq(
    "estado",
    estadoSeleccionado,
  );
}

if (
  empresaSeleccionada &&
  /^\d+$/.test(empresaSeleccionada)
) {
  consulta = consulta.eq(
    "empresa_id",
    Number(empresaSeleccionada),
  );
}
  const { data: afiliados, count, error } = await consulta;

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

    if (buscar) {
      query.set("buscar", buscar);
    }
if (estadoSeleccionado) {
  query.set("estado", estadoSeleccionado);
}

if (empresaSeleccionada) {
  query.set("empresa", empresaSeleccionada);
}
    query.set("pagina", String(numero));

    return `/gestion/sistema/afiliados?${query.toString()}`;
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
          <Link href="/gestion">
            Inicio institucional
          </Link>

          <Link href="/gestion/sindical">
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

          <Link
            className="active"
            href="/gestion/sistema"
          >
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

      <section className="main-area affiliates-register-page">
        <Link
          className="library-back"
          href="/gestion/sistema"
        >
          ← Volver a Sistema
        </Link>

        <header className="main-head">
          <div>
            <p className="kicker">
              SISTEMA · AFILIADOS
            </p>

            <h1>Consulta del padrón</h1>

            <p>
              Buscá afiliados por nombre, DNI, CUIL o
              número AOMA.
            </p>
          </div>

          <span className="secure">
            {total.toLocaleString("es-AR")} REGISTROS
          </span>
        </header>

        <form
  className="affiliate-search"
  method="get"
>
  <label htmlFor="buscar">
    Buscar en el padrón
  </label>

  <div className="affiliate-search-row">
    <input
      id="buscar"
      name="buscar"
      type="search"
      defaultValue={buscar}
      placeholder="Nombre, DNI, CUIL o número AOMA"
    />

    <button type="submit">
      🔍 Buscar
    </button>
  </div>

  <div className="affiliate-filter-row">
    <label>
      <span>Estado</span>

      <select
        name="estado"
        defaultValue={estadoSeleccionado}
      >
        <option value="">
          Todos los estados
        </option>

        {estados.map((estado) => (
          <option
            key={estado.nombre}
            value={estado.nombre}
          >
            {estado.nombre}
          </option>
        ))}
      </select>
    </label>

    <label>
      <span>Empresa</span>

      <select
        name="empresa"
        defaultValue={empresaSeleccionada}
      >
        <option value="">
          Todas las empresas activas
        </option>

        {empresas.map((empresa) => (
          <option
            key={empresa.id}
            value={String(empresa.id)}
          >
            {empresa.nombre}
          </option>
        ))}
      </select>
    </label>
  </div>

  {(buscar ||
    estadoSeleccionado ||
    empresaSeleccionada) && (
    <Link
      className="affiliate-clear"
      href="/gestion/sistema/afiliados"
    >
      Limpiar búsqueda y filtros
    </Link>
  )}
</form>

        {error ? (
          <div className="form-message error">
            No fue posible consultar el padrón.
          </div>
        ) : (
          <>
            <div className="affiliate-results">
              {afiliados?.map((afiliado) => (
                <article
                  className="affiliate-card"
                  key={afiliado.id}
                >
                  <header>
                    <div>
                      <h2>
                        {afiliado.apellido_nombres}
                      </h2>

                      <p>
                        DNI{" "}
                        {afiliado.documento_numero ||
                          "sin informar"}
                        {" · "}
                        AOMA{" "}
                        {afiliado.numero_aoma ||
                          "sin informar"}
                      </p>
                    </div>

                    <span className="affiliate-state">
                      {afiliado.estado ||
                        "SIN ESTADO"}
                    </span>
                  </header>

                  <dl>
                    <div>
                      <dt>Empresa</dt>
                      <dd>
                        {afiliado.empresa_original ||
                          "Sin informar"}
                      </dd>
                    </div>

                    <div>
                      <dt>CUIL</dt>
                      <dd>
                        {afiliado.cuil ||
                          "Sin informar"}
                      </dd>
                    </div>

                    <div>
                      <dt>Teléfono</dt>
                      <dd>
                        {afiliado.telefono_movil ||
                          "Sin informar"}
                      </dd>
                    </div>

                    <div>
                      <dt>Correo electrónico</dt>
                      <dd>
                        {afiliado.email ||
                          "Sin informar"}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}

              {!afiliados?.length && (
                <div className="empty-users">
                  No se encontraron afiliados.
                </div>
              )}
            </div>

            {totalPaginas > 1 && (
              <nav
                className="affiliate-pagination"
                aria-label="Páginas del padrón"
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
