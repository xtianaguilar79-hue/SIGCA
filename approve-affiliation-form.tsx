"use client";

export function ApproveAffiliationForm({
  applicationId,
  action,
}: {
  applicationId: string;
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form
      className="approve-affiliation-form"
      action={action}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          "¿Confirmás que la documentación fue revisada y querés incorporar esta persona al padrón como AFILIADO EN TRÁMITE?",
        );

        if (!confirmed) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={applicationId} />
      <p>
        Esta acción controla DNI y CUIL, crea el registro en el padrón y
        conserva el vínculo con la solicitud.
      </p>
      <button type="submit">Aprobar e incorporar al padrón</button>
    </form>
  );
}
