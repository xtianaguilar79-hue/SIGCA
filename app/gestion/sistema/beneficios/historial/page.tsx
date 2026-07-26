import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";

const POR_PAGINA = 50;

function mostrarFecha(valor: string) {
  const [anio, mes, dia] = valor.slice(0, 10).split("-");
  return `${dia}/${mes}/${anio}`;
}

export default async function HistorialBeneficiosPage({
  searchParams,
}: {
  searchParams: Promise<{
    buscar?: string;
    beneficio?: string;
    lugar?: string;
    desde?: string;
    hasta?: string;
    pagina?: string;
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
  const buscar = String(params.buscar || "").trim();
  const beneficioId = Number(params.beneficio || 0);
  const lugarId = Number(params.lugar || 0);
  const desdeFecha = String(params.desde || "");
  const hastaFecha = String(params.hasta || "");
  const pagina = Math.max(1, Number(params.pagina || 1) || 1);
  const desde = (pagina - 1) * POR_PAGINA;
  const hasta = desde + POR_PAGINA - 1;

  const [{ data: beneficios }, { data: lugares }] = await Promise.all([
    supabase.from("beneficios").select("id,nombre").order("nombre"),
    supabase
      .from("beneficios_lugares_entrega")
      .select("id,nombre")
      .order("nombre"),
  ]);

  let afiliadosEncontrados: string[] | null = null;

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
      .select("id")
      .or(filtros.join(","))
      .limit(500);

    afiliadosEncontrados = (data || []).map((item) => item.id);
  }

  let consulta = supabase
    .from("beneficios_entregas")
    .select(
      `
        id,
        cantidad,
        fecha_entrega,
        observaciones,
        entregado_por,
        created_at,
        beneficios ( id, nombre ),
        beneficios_lugares_entrega ( id, nombre ),
        afiliados (
          id,
          numero_aoma,
          apellido_nombres,
          documento_numero,
          empresa_original,
          estado
        )
      `,
      { count: "exact" },
    )
    .order("fecha_entrega", { ascending: false })
    .order("created_at", { ascending: false })
    .range(desde, hasta);

  if (beneficioId > 0) consulta = consulta.eq("beneficio_id", beneficioId);
  if (lugarId > 0) consulta = consulta.eq("lugar_entrega_id", lugarId);
  if (desdeFecha) consulta = consulta.gte("fecha_entrega", desdeFecha);
  if (hastaFecha) consulta = consulta.lte("fecha_entrega", hastaFecha);

  if (afiliadosEncontrados !== null) {
    if (afiliadosEncontrados.length === 0) {
      consulta = consulta.eq(
        "afiliado_id",
        "00000000-0000-0000-0000-000000000000",
      );
    } else {
      consulta = consulta.in("afiliado_id", afiliadosEncontrados);
    }
  }

  const { data, count, error } = await consulta;
  const entregas = (data || []) as unknown as Array<{
    id: number;
    cantidad: number;
    fecha_entrega: string;
    observaciones: string | null;
    entregado_por: string | null;
    beneficios: { id: number; nombre: string } | null;
    beneficios_lugares_entrega: { id: number; nombre: string } | null;
    afiliados: {
      id: string;
      numero_aoma: string | number | null;
      apellido_nombres: string | null;
      documento_numero: string | null;
      empresa_original: string | null;
      estado: string | null;
    } | null;
  }>;

  const responsablesIds = Array.from(
    new Set(
      entregas
        .map((entrega) => entrega.entregado_por)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const responsables = new Map<string, string>();

  if (responsablesIds.length > 0) {
    const { data: usuarios } = await supabase
      .from("usuarios")
      .select("id,nombre,apellido")
      .in("id", responsablesIds);

    for (const usuario of usuarios || []) {
      responsables.set(
        usuario.id,
        [usuario.nombre, usuario.apellido].filter(Boolean).join(" "),
      );
    }
  }

  const total = count || 0;
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const name = [profile.nombre, profile.apellido].filter(Boolean).join(" ");
  const exportParams = new URLSearchParams();

  if (buscar) exportParams.set("buscar", buscar);
  if (beneficioId > 0) {
    exportParams.set("beneficio", String(beneficioId));
  }
  if (lugarId > 0) {
    exportParams.set("lugar", String(lugarId));
  }
  if (desdeFecha) exportParams.set("desde", desdeFecha);
  if (hastaFecha) exportParams.set("hasta", hastaFecha);

  function enlacePagina(numero: number) {
    const query = new URLSearchParams();
    if (buscar) query.set("buscar", buscar);
    if (beneficioId > 0) query.set("beneficio", String(beneficioId));
    if (lugarId > 0) query.set("lugar", String(lugarId));
    if (desdeFecha) query.set("desde", desdeFecha);
    if (hastaFecha) query.set("hasta", hastaFecha);
    query.set("pagina", String(numero));
    return `/gestion/sistema/beneficios/historial?${query.toString()}`;
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

      <section className="main-area benefit-history-page">
        <Link className="library-back" href="/gestion/sistema/beneficios">
          ← Volver a Beneficios
        </Link>

        <header className="main-head">
          <div>
            <p className="kicker">SISTEMA · BENEFICIOS</p>
            <h1>Historial de entregas</h1>
            <p>Consultá las entregas registradas y sus responsables.</p>
          </div>
          <span className="secure">● REGISTRO INSTITUCIONAL</span>
        </header>

        <form className="benefit-history-filters" method="get">
          <label>
            <span>Buscar afiliado</span>
            <input
              type="search"
              name="buscar"
              defaultValue={buscar}
              placeholder="Nombre, DNI, CUIL o AOMA"
            />
          </label>
          <label>
            <span>Beneficio</span>
            <select name="beneficio" defaultValue={beneficioId || ""}>
              <option value="">Todos</option>
              {(beneficios || []).map((item) => (
                <option value={item.id} key={item.id}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Lugar</span>
            <select name="lugar" defaultValue={lugarId || ""}>
              <option value="">Todos</option>
              {(lugares || []).map((item) => (
                <option value={item.id} key={item.id}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Desde</span>
            <input type="date" name="desde" defaultValue={desdeFecha} />
          </label>
          <label>
            <span>Hasta</span>
            <input type="date" name="hasta" defaultValue={hastaFecha} />
          </label>
          <div>
            <button type="submit">Aplicar filtros</button>
            <Link href="/gestion/sistema/beneficios/historial">Limpiar</Link>
          </div>
        </form>

        <div className="benefit-history-total">
          <div>
            <strong>{total.toLocaleString("es-AR")} entregas</strong>
            <span>Página {pagina} de {paginas}</span>
          </div>

          <a
            className="benefit-history-download"
            href={`/api/beneficios/historial-csv?${exportParams.toString()}`}
          >
            Descargar CSV
          </a>

          <Link
            className="benefit-history-download benefit-history-pdf"
            href={`/gestion/sistema/beneficios/historial/imprimir?${exportParams.toString()}`}
          >
            Generar PDF
          </Link>
        </div>

        {error ? (
          <div className="form-message error">
            No fue posible consultar el historial.
          </div>
        ) : (
          <div className="benefit-history-list">
            {entregas.map((entrega) => (
              <article key={entrega.id}>
                <header>
                  <div>
                    <strong>{entrega.beneficios?.nombre || "Beneficio"}</strong>
                    <span>
                      {mostrarFecha(entrega.fecha_entrega)} ·{" "}
                      {entrega.beneficios_lugares_entrega?.nombre ||
                        "Sin lugar"}
                    </span>
                  </div>
                  <b>Cantidad: {entrega.cantidad}</b>
                </header>
                <div className="benefit-history-person">
                  <strong>
                    {entrega.afiliados?.apellido_nombres || "Afiliado"}
                  </strong>
                  <span>
                    DNI {entrega.afiliados?.documento_numero || "sin informar"} ·
                    AOMA {entrega.afiliados?.numero_aoma ?? 0}
                  </span>
                  <span>
                    {entrega.afiliados?.empresa_original || "Sin empresa"} ·{" "}
                    {entrega.afiliados?.estado || "Sin estado"}
                  </span>
                </div>
                <footer>
                  <span>
                    Registró:{" "}
                    {entrega.entregado_por
                      ? responsables.get(entrega.entregado_por) ||
                        "Usuario institucional"
                      : "Sin informar"}
                  </span>
                  {entrega.observaciones && <p>{entrega.observaciones}</p>}
                </footer>
              </article>
            ))}

            {entregas.length === 0 && (
              <div className="benefits-empty">
                No existen entregas que coincidan con los filtros.
              </div>
            )}
          </div>
        )}

        {paginas > 1 && (
          <nav className="benefit-history-pagination">
            {pagina > 1 && <Link href={enlacePagina(pagina - 1)}>← Anterior</Link>}
            <span>{pagina} de {paginas}</span>
            {pagina < paginas && (
              <Link href={enlacePagina(pagina + 1)}>Siguiente →</Link>
            )}
          </nav>
        )}
      </section>
    </main>
  );
}
