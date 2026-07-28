import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import {
  BenefitRecipientSelector,
  type BenefitAffiliate,
  type BenefitRelative,
} from "@/components/benefit-recipient-selector";
import { createClient } from "@/lib/supabase/server";
import { registrarEntregaBeneficio } from "./actions";

type Beneficio = {
  id: number;
  nombre: string;
  descripcion: string | null;
  stock: number | null;
  requiere_familiar: boolean | null;
};

function mostrarNumeroAoma(
  valor: string | number | null,
) {
  const numero = String(valor ?? "").trim();

  return numero && numero !== "0" ? numero : "0";
}

export default async function EntregarBeneficioPage({
  searchParams,
}: {
  searchParams: Promise<{
    lugar?: string;
    buscar?: string;
    afiliado?: string;
    guardado?: string;
    error?: string;
    detalle?: string;
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
    String(profile.estado).toLowerCase() !==
      "aprobado" ||
    String(profile.rol).toLowerCase() !==
      "administrador"
  ) {
    redirect("/gestion");
  }

  const params = await searchParams;

  const lugarSeleccionado = Number(
    params.lugar || 0,
  );

  const buscar = String(
    params.buscar || "",
  ).trim();

  const afiliadoSeleccionadoId = String(
    params.afiliado || "",
  ).trim();

  const [{ data: lugares }, { data: beneficiosData }] =
    await Promise.all([
      supabase
        .from("beneficios_lugares_entrega")
        .select("id,nombre")
        .eq("activo", true)
        .order("nombre"),

      supabase
        .from("beneficios")
        .select(
          "id,nombre,descripcion,stock,requiere_familiar",
        )
        .eq("activo", true)
        .order("nombre"),
    ]);

  const beneficios =
    (beneficiosData || []) as Beneficio[];

  let afiliados: BenefitAffiliate[] = [];
  let afiliadoSeleccionado:
    | BenefitAffiliate
    | null = null;

  let familiares: BenefitRelative[] = [];

  if (buscar.length >= 2) {
    const seguro = buscar
      .replaceAll(",", " ")
      .trim();

    const filtros = [
      `apellido_nombres.ilike.%${seguro}%`,
      `cuil.ilike.%${seguro}%`,
    ];

    if (/^\d+$/.test(seguro)) {
      filtros.push(
        `documento_numero.eq.${seguro}`,
      );

      filtros.push(`numero_aoma.eq.${seguro}`);
    }

    const { data: afiliadosData } =
      await supabase
        .from("afiliados")
        .select(
          `
            id,
            numero_aoma,
            apellido_nombres,
            documento_numero,
            cuil,
            empresa_original,
            estado
          `,
        )
        .or(filtros.join(","))
        .order("apellido_nombres")
        .limit(20);

    afiliados =
      (afiliadosData || []) as BenefitAffiliate[];

    if (afiliadoSeleccionadoId) {
      afiliadoSeleccionado =
        afiliados.find(
          (afiliado) =>
            afiliado.id ===
            afiliadoSeleccionadoId,
        ) || null;
    }

    if (afiliadoSeleccionado) {
      const { data: familiaresData } =
        await supabase
          .from("afiliados_familiares")
          .select(
            `
              id,
              afiliado_id,
              apellido_nombres,
              vinculo,
              documento_numero,
              fecha_nacimiento
            `,
          )
          .eq(
            "afiliado_id",
            afiliadoSeleccionado.id,
          )
          .eq("activo", true)
          .order("apellido_nombres");

      familiares =
        (familiaresData ||
          []) as BenefitRelative[];
    }
  }

  const name = [
    profile.nombre,
    profile.apellido,
  ]
    .filter(Boolean)
    .join(" ");

  function enlaceLugar(id: number) {
    const query = new URLSearchParams();

    query.set("lugar", String(id));

    if (buscar) {
      query.set("buscar", buscar);
    }

    return (
      "/gestion/sistema/beneficios/entregar?" +
      query.toString()
    );
  }

  function enlaceAfiliado(id: string) {
    const query = new URLSearchParams();

    if (lugarSeleccionado > 0) {
      query.set(
        "lugar",
        String(lugarSeleccionado),
      );
    }

    query.set("buscar", buscar);
    query.set("afiliado", id);

    return (
      "/gestion/sistema/beneficios/entregar?" +
      query.toString()
    );
  }

  function enlaceCambiarAfiliado() {
    const query = new URLSearchParams();

    if (lugarSeleccionado > 0) {
      query.set(
        "lugar",
        String(lugarSeleccionado),
      );
    }

    if (buscar) {
      query.set("buscar", buscar);
    }

    return (
      "/gestion/sistema/beneficios/entregar?" +
      query.toString()
    );
  }

  return (
    <main className="management">
      <aside className="side">
        <Link
          className="side-brand"
          href="/gestion"
        >
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
            <p className="kicker">
              SISTEMA · BENEFICIOS
            </p>

            <h1>Entregar beneficio</h1>

            <p>
              Registrá el lugar, el afiliado o
              familiar y el beneficio entregado.
            </p>
          </div>

          <span className="secure">
            ● OPERACIÓN REGISTRADA
          </span>
        </header>

        {params.guardado === "1" && (
          <div className="form-message success">
            La entrega se registró correctamente.
          </div>
        )}

        {params.error && (
          <div className="form-message error">
            No fue posible registrar la entrega.
            {params.detalle
              ? ` ${decodeURIComponent(
                  params.detalle,
                )}`
              : ""}
          </div>
        )}

        <section className="delivery-step">
          <span className="delivery-step-number">
            1
          </span>

          <div className="delivery-step-content">
            <h2>
              Seleccioná el lugar de entrega
            </h2>

            <div className="delivery-location-buttons">
              {(lugares || []).map((lugar) => (
                <Link
                  className={
                    lugarSeleccionado === lugar.id
                      ? "active"
                      : ""
                  }
                  href={enlaceLugar(lugar.id)}
                  key={lugar.id}
                >
                  {lugar.nombre}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="delivery-step">
          <span className="delivery-step-number">
            2
          </span>

          <div className="delivery-step-content">
            <h2>Buscá al afiliado</h2>

            <form
              className="delivery-search"
              method="get"
            >
              {lugarSeleccionado > 0 && (
                <input
                  type="hidden"
                  name="lugar"
                  value={lugarSeleccionado}
                />
              )}

              <input
                type="search"
                name="buscar"
                defaultValue={buscar}
                placeholder="Nombre, DNI, CUIL o número AOMA"
                minLength={2}
                required
              />

              <button type="submit">
                🔍 Buscar
              </button>
            </form>
          </div>
        </section>

        {buscar.length >= 2 &&
          !afiliadoSeleccionado && (
            <section className="delivery-step">
              <span className="delivery-step-number">
                3
              </span>

              <div className="delivery-step-content">
                <h2>
                  Seleccioná un afiliado
                </h2>

                <p className="delivery-help">
                  Primero elegí al afiliado titular.
                  Después podrás seleccionar al titular
                  o a uno de sus familiares.
                </p>

                <div className="delivery-affiliate-list">
                  {afiliados.map((afiliado) => (
                    <Link
  className="delivery-affiliate-card delivery-affiliate-card-link"
  href={enlaceAfiliado(afiliado.id)}
  key={afiliado.id}
  aria-label={`Seleccionar a ${
    afiliado.apellido_nombres || "este afiliado"
  }`}
>
  <header>
    <div>
      <strong>
        {afiliado.apellido_nombres ||
          "Afiliado sin nombre"}
      </strong>

      <span>
        DNI{" "}
        {afiliado.documento_numero ||
          "sin informar"}
      </span>

      <span>
        Número AOMA{" "}
        {mostrarNumeroAoma(
          afiliado.numero_aoma,
        )}
      </span>

      <span>
        {afiliado.empresa_original ||
          "Sin empresa"}
        {" · "}
        {afiliado.estado || "Sin estado"}
      </span>
    </div>

    <span className="delivery-card-arrow" aria-hidden="true">
      ›
    </span>
  </header>
</Link>
                      <header>
                        <div>
                          <strong>
                            {afiliado.apellido_nombres ||
                              "Afiliado sin nombre"}
                          </strong>

                          <span>
                            DNI{" "}
                            {afiliado.documento_numero ||
                              "sin informar"}
                          </span>

                          <span>
                            Número AOMA{" "}
                            {mostrarNumeroAoma(
                              afiliado.numero_aoma,
                            )}
                          </span>

                          <span>
                            {afiliado.empresa_original ||
                              "Sin empresa"}
                            {" · "}
                            {afiliado.estado ||
                              "Sin estado"}
                          </span>
                        </div>

                      
                      </header>
                    </article>
                  ))}

                  {afiliados.length === 0 && (
                    <p className="delivery-empty">
                      No se encontraron afiliados con
                      ese criterio.
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

        {afiliadoSeleccionado && (
          <form
            className="delivery-register"
            action={registrarEntregaBeneficio}
          >
            <input
              type="hidden"
              name="lugar_entrega_id"
              value={
                lugarSeleccionado || ""
              }
            />

            <section className="delivery-step">
              <span className="delivery-step-number">
                3
              </span>

              <div className="delivery-step-content">
                <div className="delivery-step-heading">
                  <div>
                    <h2>
                      Seleccioná quién recibe el
                      beneficio
                    </h2>

                    <p className="delivery-help">
                      Elegí al titular o a uno de sus
                      familiares registrados.
                    </p>
                  </div>

                  <Link
                    className="delivery-change-affiliate"
                    href={enlaceCambiarAfiliado()}
                  >
                    Cambiar afiliado
                  </Link>
                </div>

                <BenefitRecipientSelector
                  afiliado={afiliadoSeleccionado}
                  familiares={familiares}
                />
              </div>
            </section>

            <section className="delivery-step">
              <span className="delivery-step-number">
                4
              </span>

              <div className="delivery-step-content">
                <h2>Completá la entrega</h2>

                <div className="delivery-fields">
                  <label>
                    <span>Beneficio</span>

                    <select
                      name="beneficio_id"
                      required
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Seleccionar beneficio
                      </option>

                      {beneficios.map(
                        (beneficio) => (
                          <option
                            value={beneficio.id}
                            key={beneficio.id}
                          >
                            {beneficio.nombre}
                            {beneficio.stock === null
                              ? ""
                              : ` · Stock: ${beneficio.stock}`}
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label>
                    <span>Cantidad</span>

                    <input
                      type="number"
                      name="cantidad"
                      min={1}
                      defaultValue={1}
                      required
                    />
                  </label>

                  <label className="delivery-observations">
                    <span>Observaciones</span>

                    <textarea
                      name="observaciones"
                      rows={3}
                      placeholder="Detalle opcional de la entrega"
                    />
                  </label>
                </div>

                <button
                  className="delivery-submit"
                  type="submit"
                  disabled={!lugarSeleccionado}
                >
                  Confirmar y registrar entrega
                </button>

                {!lugarSeleccionado && (
                  <p className="delivery-warning">
                    Primero seleccioná el lugar de
                    entrega.
                  </p>
                )}
              </div>
            </section>
          </form>
        )}
      </section>
    </main>
  );
}
