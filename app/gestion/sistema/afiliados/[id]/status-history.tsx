type CambioEstado = {
  id: number;
  estado_anterior: string | null;
  estado_nuevo: string | null;
  observacion: string | null;
  cambiado_por: string | null;
  cambiado_at: string;
};

type Responsable = {
  id: string;
  nombre: string | null;
  apellido: string | null;
};

function fechaHora(valor: string) {
  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return valor;
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(fecha);
}

export function AffiliateStatusHistory({
  cambios,
  responsables,
}: {
  cambios: CambioEstado[];
  responsables: Responsable[];
}) {
  const nombres = new Map(
    responsables.map((persona) => [
      persona.id,
      [persona.nombre, persona.apellido]
        .filter(Boolean)
        .join(" "),
    ]),
  );

  return (
    <section className="affiliate-history">
      <h2>Historial de estados</h2>

      <p>
        Registro cronológico de los cambios realizados
        sobre la situación del afiliado.
      </p>

      {cambios.length === 0 ? (
        <div className="affiliate-history-empty">
          Todavía no se registraron cambios de estado
          desde la incorporación del padrón a SIGCA.
        </div>
      ) : (
        <div className="affiliate-history-list">
          {cambios.map((cambio) => (
            <article key={cambio.id}>
              <div className="affiliate-history-states">
                <span
                  className="affiliate-state"
                  data-state={
                    cambio.estado_anterior || "SIN ESTADO"
                  }
                >
                  {cambio.estado_anterior || "SIN ESTADO"}
                </span>

                <b aria-hidden="true">→</b>

                <span
                  className="affiliate-state"
                  data-state={
                    cambio.estado_nuevo || "SIN ESTADO"
                  }
                >
                  {cambio.estado_nuevo || "SIN ESTADO"}
                </span>
              </div>

              <p>
                {cambio.observacion ||
                  "Sin observación registrada."}
              </p>

              <footer>
                <strong>
                  {cambio.cambiado_por
                    ? nombres.get(cambio.cambiado_por) ||
                      "Usuario institucional"
                    : "Importación inicial"}
                </strong>

                <time dateTime={cambio.cambiado_at}>
                  {fechaHora(cambio.cambiado_at)}
                </time>
              </footer>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
