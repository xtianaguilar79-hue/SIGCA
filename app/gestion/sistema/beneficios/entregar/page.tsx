import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";
import { registrarEntregaBeneficio } from "./actions";

export default async function EntregarBeneficioPage({
  searchParams,
}: {
  searchParams: Promise<{
    lugar?: string;
    buscar?: string;
    guardado?: string;
    error?: string;
    detalle?: string;
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
  const lugarSeleccionado = Number(params.lugar || 0);
  const buscar = String(params.buscar || "").trim();

  const [{ data: lugares }, { data: beneficios }] = await Promise.all([
    supabase
      .from("beneficios_lugares_entrega")
      .select("id,nombre")
      .eq("activo", true)
      .order("nombre"),
    supabase
      .from("beneficios")
      .select("id,nombre,descripcion,stock")
      .eq("activo", true)
      .order("nombre"),
  ]);

  let afiliados: Array<{
    id: string;
    numero_aoma: string | number | null;
    apellido_nombres: string | null;
    documento_numero: string | null;
    cuil: string | null;
    empresa_original: string | null;
    estado: string | null;
  }> = [];

  if (buscar.length >= 2) {
    const seguro = buscar.replaceAll(",", " ");
    const filtros = [
      `apellido_nombres.ilike.%${seguro}%`,
      `cuil.ilike.%${seguro}%`,
    ];

    if (/^\d+$/.test(seguro)) {
      filtros.push(`documento_numero.eq.${seguro}`);
      filtros.push(`numero_aoma.eq.${seguro}`);
    }

    const { data } = await supabase
      .from("afiliados")
      .select(
        "id,numero_aoma,apellido_nombres,documento_numero,cuil,empresa_original,estado",
      )
      .or(filtros.join(","))
      .order("apellido_nombres")
      .limit(20);

    afiliados = (data || []) as typeof afiliados;
  }

  const name = [profile.nombre, profile.apellido].filter(Boolean).join(" ");

  function enlaceLugar(id: number) {
    const query = new URLSearchParams();
    query.set("lugar", String(id));
    if (buscar) query.set("buscar", buscar);
    return `/gestion/sistema/beneficios/entregar?${query.toString()}`;
  }

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

      <section className="main-area benefit-delivery-page">
        <Link className="library-back" href="/gestion/sistema/beneficios">
          ← Volver a Beneficios
        </Link>

        <header className="main-head">
          <div>
            <p className="kicker">SISTEMA · BENEFICIOS</p>
            <h1>Entregar beneficio</h1>
            <p>Registrá el lugar, la persona y el beneficio entregado.</p>
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
            No fue posible registrar la entrega.
            {params.detalle ? ` ${decodeURIComponent(params.detalle)}` : ""}
          </div>
        )}

        <section className="delivery-step">
          <span className="delivery-step-number">1</span>
          <div className="delivery-step-content">
            <h2>Seleccioná el lugar de entrega</h2>
            <div className="delivery-location-buttons">
              {(lugares || []).map((lugar) => (
                <Link
                  className={lugarSeleccionado === lugar.id ? "active" : ""}
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
          <span className="delivery-step-number">2</span>
          <div className="delivery-step-content">
            <h2>Buscá al afiliado</h2>
            <form className="delivery-search" method="get">
              {lugarSeleccionado > 0 && (
                <input type="hidden" name="lugar" value={lugarSeleccionado} />
              )}
              <input
                type="search"
                name="buscar"
                defaultValue={buscar}
                placeholder="Nombre, DNI, CUIL o número AOMA"
                minLength={2}
                required
              />
              <button type="submit">Buscar</button>
            </form>
          </div>
        </section>

        {buscar.length >= 2 && (
          <form className="delivery-register" action={registrarEntregaBeneficio}>
            <input
              type="hidden"
              name="lugar_entrega_id"
              value={lugarSeleccionado || ""}
            />

            <section className="delivery-step">
              <span className="delivery-step-number">3</span>
              <div className="delivery-step-content">
                <h2>Confirmá la persona</h2>
                <div className="delivery-affiliate-list">
                  {afiliados.map((afiliado) => (
                    <label key={afiliado.id}>
                      <input
                        type="radio"
                        name="afiliado_id"
                        value={afiliado.id}
                        required
                      />
                      <div>
                        <strong>{afiliado.apellido_nombres}</strong>
                        <span>
                          DNI {afiliado.documento_numero || "sin informar"} ·
                          AOMA {afiliado.numero_aoma || "sin informar"}
                        </span>
                        <span>
                          {afiliado.empresa_original || "Sin empresa"} ·{" "}
                          {afiliado.estado || "Sin estado"}
                        </span>
                      </div>
                    </label>
                  ))}
                  {afiliados.length === 0 && (
                    <p className="delivery-empty">
                      No se encontraron afiliados con ese criterio.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {afiliados.length > 0 && (
              <section className="delivery-step">
                <span className="delivery-step-number">4</span>
                <div className="delivery-step-content">
                  <h2>Completá la entrega</h2>
                  <div className="delivery-fields">
                    <label>
                      <span>Beneficio</span>
                      <select name="beneficio_id" required defaultValue="">
                        <option value="" disabled>
                          Seleccionar beneficio
                        </option>
                        {(beneficios || []).map((beneficio) => (
                          <option value={beneficio.id} key={beneficio.id}>
                            {beneficio.nombre}
                            {beneficio.stock === null
                              ? ""
                              : ` · Stock: ${beneficio.stock}`}
                          </option>
                        ))}
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
                      <textarea name="observaciones" rows={3} />
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
                      Primero seleccioná el lugar de entrega.
                    </p>
                  )}
                </div>
              </section>
            )}
          </form>
        )}
      </section>
    </main>
  );
}
