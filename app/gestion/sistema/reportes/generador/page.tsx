import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";

const VISTA_PREVIA = 50;

export default async function GeneradorReporteAfiliadosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; empresa?: string }>;
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
  const estadoSeleccionado = String(params.estado || "").trim();
  const empresaSeleccionada = String(params.empresa || "").trim();

  const [{ data: estados }, { data: empresas }] = await Promise.all([
    supabase
      .from("estados_afiliado")
      .select("nombre")
      .eq("habilitado", true)
      .order("orden"),
    supabase
      .from("empresas")
      .select("id,nombre,activa")
      .order("nombre"),
  ]);

  const empresaEncontrada = (empresas || []).find(
    (item) => item.nombre === empresaSeleccionada,
  );

  let consulta = supabase
    .from("afiliados")
    .select(
      "id,numero_aoma,apellido_nombres,documento_numero,cuil,empresa_original,estado,email",
      { count: "exact" },
    )
    .order("apellido_nombres", { ascending: true })
    .range(0, VISTA_PREVIA - 1);

  if (estadoSeleccionado) {
    consulta = consulta.eq("estado", estadoSeleccionado);
  }

  if (empresaEncontrada) {
    consulta = consulta.eq("empresa_id", empresaEncontrada.id);
  }

  if (empresaSeleccionada && !empresaEncontrada) {
    consulta = consulta.eq("empresa_id", -1);
  }

  const { data: afiliados, count, error } = await consulta;
  const total = count || 0;

  const exportParams = new URLSearchParams();
  if (estadoSeleccionado) exportParams.set("estado", estadoSeleccionado);
  if (empresaSeleccionada) exportParams.set("empresa", empresaSeleccionada);

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

      <section className="main-area report-generator-page">
        <Link
          className="library-back"
          href="/gestion/sistema/reportes/afiliados"
        >
          ← Volver al reporte general
        </Link>

        <header className="main-head">
          <div>
            <p className="kicker">REPORTES · GENERADOR</p>
            <h1>Listado de afiliados</h1>
            <p>
              Combiná estado y empresa para preparar el listado institucional.
            </p>
          </div>
          <span className="secure">
            {total.toLocaleString("es-AR")} RESULTADOS
          </span>
        </header>

        <form className="report-generator-filters" method="get">
          <label>
            <span>Estado afiliatorio</span>
            <select name="estado" defaultValue={estadoSeleccionado}>
              <option value="">Todos los estados</option>
              {(estados || []).map((estado) => (
                <option key={estado.nombre} value={estado.nombre}>
                  {estado.nombre}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Empresa</span>
            <input
              type="search"
              name="empresa"
              list="empresas-reporte"
              defaultValue={empresaSeleccionada}
              placeholder="Todas las empresas"
              autoComplete="off"
            />
            <datalist id="empresas-reporte">
              {(empresas || []).map((empresa) => (
                <option key={empresa.id} value={empresa.nombre}>
                  {empresa.activa ? "Activa" : "Inactiva"}
                </option>
              ))}
            </datalist>
          </label>

          <div className="report-generator-buttons">
            <button type="submit">Aplicar filtros</button>
            <Link href="/gestion/sistema/reportes/generador">
              Limpiar
            </Link>
          </div>
        </form>

        <div className="report-export-bar">
          <div>
            <strong>{total.toLocaleString("es-AR")} personas</strong>
            <span>
              La pantalla muestra hasta {VISTA_PREVIA}; el CSV incluye todas.
            </span>
          </div>
          <a
            href={`/api/reportes/afiliados/csv?${exportParams.toString()}`}
          >
            Descargar CSV
          </a>
        </div>

        {error ? (
          <div className="form-message error">
            No fue posible consultar el padrón.
          </div>
        ) : (
          <div className="report-preview">
            <table>
              <thead>
                <tr>
                  <th>N.º AOMA</th>
                  <th>Apellido y nombres</th>
                  <th>DNI</th>
                  <th>Empresa</th>
                  <th>Estado</th>
                  <th>Correo</th>
                </tr>
              </thead>
              <tbody>
                {(afiliados || []).map((afiliado) => (
                  <tr key={afiliado.id}>
                    <td>{afiliado.numero_aoma || "—"}</td>
                    <td>{afiliado.apellido_nombres}</td>
                    <td>{afiliado.documento_numero || "—"}</td>
                    <td>{afiliado.empresa_original || "Sin informar"}</td>
                    <td>{afiliado.estado || "Sin informar"}</td>
                    <td>{afiliado.email || "Sin informar"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!afiliados?.length && (
              <div className="empty-users">
                No hay personas que coincidan con los filtros.
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
