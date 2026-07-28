import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { BenefitRecipientSelector } from "@/components/benefit-recipient-selector";
import type {
  BenefitAffiliate,
  BenefitRelative,
} from "@/components/benefit-recipient-selector";
import { createClient } from "@/lib/supabase/server";
import { registrarEntregaBeneficio } from "./actions";

type SearchParams = Promise<{
  lugar?: string;
  buscar?: string;
  afiliado?: string;
  guardado?: string;
  error?: string;
  detalle?: string;
}>;

function texto(valor: unknown, reemplazo = "Sin informar") {
  const resultado = String(valor ?? "").trim();
  return resultado || reemplazo;
}

function numeroAoma(valor: unknown) {
  const resultado = String(valor ?? "").trim();
  return resultado && resultado.toLowerCase() !== "null" ? resultado : "0";
}

function enlaceConParametros(
  parametros: Record<string, string | undefined>,
) {
  const query = new URLSearchParams();

  Object.entries(parametros).forEach(([clave, valor]) => {
    if (valor) query.set(clave, valor);
  });

  const resultado = query.toString();

  return `/gestion/sistema/beneficios/entregar${
    resultado ? `?${resultado}` : ""
  }`;
}

export default async function EntregarBeneficioPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
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

  const lugarSeleccionado = String(params.lugar ?? "").trim();
  const buscar = String(params.buscar ?? "").trim();
  const afiliadoSeleccionadoId = String(params.afiliado ?? "").trim();

  const [
    lugaresResult,
    beneficiosResult,
    afiliadoSeleccionadoResult,
  ] = await Promise.all([
    supabase
      .from("beneficios_lugares_entrega")
      .select("id,nombre")
      .eq("activo", true)
      .order("nombre", { ascending: true }),
    supabase
      .from("beneficios")
      .select(
        "id,nombre,descripcion,stock,activo,categoria,modalidad,requiere_familiar,permite_multiples",
      )
      .eq("activo", true)
      .order("nombre", { ascending: true }),
    afiliadoSeleccionadoId
      ? supabase
          .from("afiliados")
          .select(
            "id,apellido_nombres,documento_numero,numero_aoma,empresa_original,estado",
          )
          .eq("id", afiliadoSeleccionadoId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const lugares = lugaresResult.data ?? [];
  const beneficios = beneficiosResult.data ?? [];
  const afiliadoSeleccionado = afiliadoSeleccionadoResult.data as
    | BenefitAffiliate
    | null;

  let afiliados: BenefitAffiliate[] = [];

  if (buscar && !afiliadoSeleccionado) {
    let consulta = supabase
      .from("afiliados")
      .select(
        "id,apellido_nombres,documento_numero,numero_aoma,empresa_original,estado",
      )
      .order("apellido_nombres", { ascending: true })
      .limit(25);

    const termino = buscar.replace(/[,%()]/g, " ").trim();

    if (/^\d+$/.test(termino)) {
      consulta = consulta.or(
        `documento_numero.ilike.%${termino}%,numero_aoma.eq.${termino}`,
      );
    } else {
      consulta = consulta.ilike("apellido_nombres", `%${termino}%`);
    }

    const { data } = await consulta;
    afiliados = (data ?? []) as BenefitAffiliate[];
  }

  let familiares: BenefitRelative[] = [];

  if (afiliadoSeleccionado) {
    const { data } = await supabase
      .from("afiliados_familiares")
      .select(
        "id,afiliado_id,apellido_nombres,vinculo,documento_numero,fecha_nacimiento",
      )
      .eq("afiliado_id", afiliadoSeleccionado.id)
      .eq("activo", true)
      .order("vinculo", { ascending: true })
      .order("apellido_nombres", { ascending: true });

    familiares = (data ?? []) as BenefitRelative[];
  }

  const name = [profile.nombre, profile.apellido]
    .filter(Boolean)
    .join(" ");

  function enlaceAfiliado(id: string) {
    return enlaceConParametros({
      lugar: lugarSeleccionado,
      buscar,
      afiliado: id,
    });
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
          <Link href="/gestion/sistema">Sistema</Link>
          <Link href="/gestion/perfil">Mi perfil</Link>
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

      <section className="main-area benefit-delivery-page">
        <Link
          className="library-back"
          href="/gestion/sistema/beneficios"
        >
          ← Volver a Beneficios
        </Link>

        <header className="main-head">
          <div>
            <p className="kicker">SISTEMA · BENEFICIOS</p>
            <h1>Entregar un beneficio</h1>
            <p>
              Registrá cada entrega con su lugar, destinatario y
              responsable institucional.
            </p>
          </div>

          <span className="secure">● OPERACIÓN REGISTRADA</span>
        </header>

        {params.guardado === "1" && (
          <div className="form-message success">
            La entrega se registró correctamente.
          </div>
        )}

        {params.error && (
          <div className="form-message error">
            {params.detalle
              ? decodeURIComponent(params.detalle)
              : "No se pudo registrar la entrega."}
          </div>
        )}

        <section className="delivery-step">
          <div className="delivery-step-number">1</div>

          <div className="delivery-step-content">
            <div className="delivery-step-heading">
              <div>
                <h2>Seleccioná el lugar de entrega</h2>
                <p>
                  Elegí la sede desde la que se realizará la operación.
                </p>
              </div>
            </div>

            <div className="delivery-place-grid">
              {lugares.map((lugar) => (
                <Link
                  className={
                    lugarSeleccionado === String(lugar.id)
                      ? "delivery-place is-selected"
                      : "delivery-place"
                  }
                  href={enlaceConParametros({
                    lugar: String(lugar.id),
                    buscar,
                    afiliado: afiliadoSeleccionadoId,
                  })}
                  key={lugar.id}
                >
                  <span>⌖</span>
                  <strong>{lugar.nombre}</strong>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="delivery-step">
          <div className="delivery-step-number">2</div>

          <div className="delivery-step-content">
            <div className="delivery-step-heading">
              <div>
                <h2>Buscá al afiliado titular</h2>
                <p>
                  Buscá por apellido, DNI o número de afiliado. Después
                  tocá la tarjeta correcta.
                </p>
              </div>
            </div>

            {!afiliadoSeleccionado && (
              <form
                className="delivery-search-form"
                method="get"
                action="/gestion/sistema/beneficios/entregar"
              >
                {lugarSeleccionado && (
                  <input
                    type="hidden"
                    name="lugar"
                    value={lugarSeleccionado}
                  />
                )}

                <label>
                  <span>Afiliado</span>
                  <input
                    type="search"
                    name="buscar"
                    defaultValue={buscar}
                    placeholder="Apellido, DNI o número AOMA"
                    autoComplete="off"
                    required
                  />
                </label>

                <button type="submit">🔍 Buscar</button>
              </form>
            )}

            {!afiliadoSeleccionado && buscar && (
              <div className="delivery-affiliate-results">
                {afiliados.length > 0 ? (
                  afiliados.map((afiliado) => (
                    <Link
                      className="delivery-affiliate-result"
                      href={enlaceAfiliado(afiliado.id)}
                      key={afiliado.id}
                    >
                      <div>
                        <strong>{afiliado.apellido_nombres}</strong>
                        <span>
                          DNI {texto(afiliado.documento_numero)} · AOMA{" "}
                          {numeroAoma(afiliado.numero_aoma)}
                        </span>
                      </div>

                      <span className="delivery-affiliate-company">
                        {texto(afiliado.empresa_original)}
                      </span>
                    </Link>
                  ))
                ) : (
                  <div className="delivery-empty">
                    No se encontraron afiliados con ese dato.
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {afiliadoSeleccionado && (
          <form action={registrarEntregaBeneficio}>
            <input
              type="hidden"
              name="lugar_entrega_id"
              value={lugarSeleccionado}
            />

            <section className="delivery-step">
              <div className="delivery-step-number">3</div>

              <div className="delivery-step-content">
                <div className="delivery-step-heading">
                  <div>
                    <h2>Seleccioná quién recibe el beneficio</h2>
                    <p>
                      Elegí al titular o a uno de sus familiares
                      registrados.
                    </p>
                  </div>
                </div>

                <BenefitRecipientSelector
                  afiliado={afiliadoSeleccionado}
                  familiares={familiares}
                />
              </div>
            </section>

            <section className="delivery-step">
              <div className="delivery-step-number">4</div>

              <div className="delivery-step-content">
                <div className="delivery-step-heading">
                  <div>
                    <h2>Completá la entrega</h2>
                    <p>
                      Elegí el beneficio, indicá la cantidad y agregá una
                      observación si es necesaria.
                    </p>
                  </div>
                </div>

                <div className="delivery-final-grid">
                  <label>
                    <span>Beneficio</span>
                    <select
                      name="beneficio_id"
                      defaultValue=""
                      required
                    >
                      <option value="" disabled>
                        Seleccioná un beneficio
                      </option>

                      {beneficios.map((beneficio) => (
                        <option
                          value={beneficio.id}
                          key={beneficio.id}
                        >
                          {beneficio.nombre}
                          {beneficio.stock === null
                            ? " · Sin control de stock"
                            : ` · Stock ${beneficio.stock}`}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Cantidad</span>
                    <input
                      type="number"
                      name="cantidad"
                      min="1"
                      defaultValue="1"
                      required
                    />
                  </label>

                  <label className="delivery-observation">
                    <span>Observaciones</span>
                    <textarea
                      name="observaciones"
                      rows={4}
                      placeholder="Detalle opcional de la entrega"
                    />
                  </label>
                </div>

                {!lugarSeleccionado && (
                  <p className="delivery-warning">
                    Primero seleccioná un lugar de entrega.
                  </p>
                )}

                <button
                  className="delivery-submit"
                  type="submit"
                  disabled={!lugarSeleccionado}
                >
                  Registrar entrega
                </button>
              </div>
            </section>
          </form>
        )}
      </section>
    </main>
  );
}
