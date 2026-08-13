"use client";

export function PrintReportButton() {
  return (
    <button
      className="print-report-button"
      type="button"
      onClick={() => window.print()}
    >
      Imprimir o guardar como PDF
    </button>
  );
}
