export type BenefitDelivery = {
  id: number;
  cantidad: number | null;
  fecha_entrega: string | null;
  fecha_entrega_confirmada: boolean | null;
  observaciones: string | null;
  destinatario_tipo: string | null;
  destinatario_nombre_original: string | null;
  origen_registro: string | null;
  entregado_por: string | null;
  created_at: string;
  beneficio: {
    nombre: string;
    categoria: string | null;
  } | null;
  familiar: {
    apellido_nombres: string;
    vinculo: string;
  } | null;
};

type Responsable = {
  id: string;
  nombre: string | null;
  apellido: string | null;
};

function mostrarFecha(fecha: string | null) {
  if (!fecha) return "Fecha pendiente de verificación";

  const valor = new Date(`${fecha.slice(0, 10)}T12:00:00`);

  return new Intl.DateTimeFormat("es-AR").format(valor);
}

export function AffiliateBenefitHistory({
  entregas,
  responsables,
}: {
  entregas: BenefitDelivery[];
  responsables: Responsable[];
}) {
  const nombres = new Map(
    responsables.map((responsable) => [
      responsable.id,
      [responsable.nombre, responsable.apellido]
        .filter(Boolean)
        .join(" "),
    ]),
  );

  return (
    <section className="affiliate-detail-section">
      <p className="kicker">MOVIMIENTOS INSTITUCIONALES</p>
      <h2>Historial de beneficios</h2>

      <p>
        Beneficios registrados para el afiliado titular o para
        integrantes de su grupo familiar.
      </p>

      {entregas.length === 0 ? (
        <div className="affiliate-empty-history">
          Todavía no hay beneficios registrados para esta persona.
        </div>
      ) : (
        <div className="benefit-history-list">
          {entregas.map((entrega) => {
            const destinatario =
              entrega.familiar?.apellido_nombres ||
              entrega.destinatario_nombre_original ||
              "Afiliado titular";

            const vinculo =
              entrega.familiar?.vinculo ||
              entrega.destinatario_tipo ||
              "TITULAR";

            const responsable = entrega.entregado_por
              ? nombres.get(entrega.entregado_por)
              : "";

            return (
              <article
                className="benefit-history-item"
                key={entrega.id}
              >
                <header>
                  <div>
                    <span className="benefit-history-category">
                      {entrega.beneficio?.categoria ||
                        "BENEFICIO"}
                    </span>

                    <h3>
                      {entrega.beneficio?.nombre ||
                        "Beneficio histórico"}
                    </h3>
                  </div>

                  <strong>
                    {entrega.fecha_entrega_confirmada
                      ? mostrarFecha(entrega.fecha_entrega)
                      : "Fecha pendiente de verificación"}
                  </strong>
                </header>

                <dl>
                  <div>
                    <dt>Destinatario</dt>
                    <dd>{destinatario}</dd>
                  </div>

                  <div>
                    <dt>Vínculo</dt>
                    <dd>{vinculo}</dd>
                  </div>

                  <div>
                    <dt>Cantidad</dt>
                    <dd>{entrega.cantidad || 1}</dd>
                  </div>

                  <div>
                    <dt>Origen</dt>
                    <dd>
                      {entrega.origen_registro === "LEGACY"
                        ? "Sistema anterior"
                        : "SIGCA"}
                    </dd>
                  </div>
                </dl>

                {entrega.observaciones && (
                  <p>{entrega.observaciones}</p>
                )}

                {responsable && (
                  <small>Registrado por {responsable}</small>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
