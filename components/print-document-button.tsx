"use client";

export function PrintDocumentButton() {
  return <button className="print-document-button" type="button" onClick={() => window.print()}>
    Imprimir documento
    <style jsx>{`
      .print-document-button{min-height:44px;padding:11px 17px;border:0;border-radius:8px;background:#0b5264;color:white;font-family:inherit;font-size:14px;font-weight:900;cursor:pointer}
      @media(max-width:700px){.print-document-button{width:100%}}
      @media print{.print-document-button{display:none}}
    `}</style>
  </button>;
}
