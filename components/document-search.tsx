"use client";

import { useEffect, useRef, useState } from "react";

export function DocumentSearch({ html }: { html: string }) {
  const contentRef = useRef<HTMLElement>(null);
  const [query, setQuery] = useState("");
  const [resultCount, setResultCount] = useState(0);
  const [activeResult, setActiveResult] = useState(0);

  useEffect(() => {
    const container = contentRef.current;

    if (!container) {
      return;
    }

    container.innerHTML = html;

    const searchTerm = query.trim();

    if (searchTerm.length < 2) {
      setResultCount(0);
      setActiveResult(0);
      return;
    }

    const escapedTerm = searchTerm.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );

    const expression = new RegExp(`(${escapedTerm})`, "gi");

    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
    );

    const textNodes: Text[] = [];
    let currentNode = walker.nextNode();

    while (currentNode) {
      const parent = currentNode.parentElement;

      if (
        parent &&
        !["SCRIPT", "STYLE", "MARK"].includes(parent.tagName) &&
        currentNode.textContent?.toLowerCase().includes(
          searchTerm.toLowerCase(),
        )
      ) {
        textNodes.push(currentNode as Text);
      }

      currentNode = walker.nextNode();
    }

    textNodes.forEach((textNode) => {
      const text = textNode.textContent || "";
      const parts = text.split(expression);

      if (parts.length <= 1) {
        return;
      }

      const fragment = document.createDocumentFragment();

      parts.forEach((part) => {
        if (part.toLowerCase() === searchTerm.toLowerCase()) {
          const mark = document.createElement("mark");
          mark.className = "document-search-mark";
          mark.textContent = part;
          fragment.appendChild(mark);
        } else {
          fragment.appendChild(document.createTextNode(part));
        }
      });

      textNode.parentNode?.replaceChild(fragment, textNode);
    });

    const marks = container.querySelectorAll(
      ".document-search-mark",
    );

    setResultCount(marks.length);
    setActiveResult(marks.length ? 1 : 0);
  }, [html, query]);

  useEffect(() => {
    const container = contentRef.current;

    if (!container || activeResult < 1) {
      return;
    }

    const marks = container.querySelectorAll(
      ".document-search-mark",
    );

    marks.forEach((mark) =>
      mark.classList.remove("document-search-mark-active"),
    );

    const selected = marks[activeResult - 1];

    if (selected) {
      selected.classList.add("document-search-mark-active");
      selected.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeResult, resultCount]);

  function previousResult() {
    if (!resultCount) {
      return;
    }

    setActiveResult((current) =>
      current <= 1 ? resultCount : current - 1,
    );
  }

  function nextResult() {
    if (!resultCount) {
      return;
    }

    setActiveResult((current) =>
      current >= resultCount ? 1 : current + 1,
    );
  }

  function clearSearch() {
    setQuery("");
  }

  return (
    <>
      <section
        className="document-search"
        aria-label="Buscar dentro del documento"
      >
        <label htmlFor="document-search-input">
          Buscar dentro de esta ley o convenio
        </label>

        <div className="document-search-controls">
          <input
            id="document-search-input"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ejemplo: jornada, salario, seguridad..."
          />

          {query && (
            <button
              type="button"
              className="document-search-clear"
              onClick={clearSearch}
            >
              Limpiar
            </button>
          )}
        </div>

        <div className="document-search-navigation">
          <span aria-live="polite">
            {query.trim().length < 2
              ? "Escribí al menos dos letras."
              : resultCount
                ? `${activeResult} de ${resultCount} coincidencias`
                : "No se encontraron coincidencias."}
          </span>

          <div>
            <button
              type="button"
              onClick={previousResult}
              disabled={!resultCount}
              aria-label="Coincidencia anterior"
            >
              ← Anterior
            </button>

            <button
              type="button"
              onClick={nextResult}
              disabled={!resultCount}
              aria-label="Coincidencia siguiente"
            >
              Siguiente →
            </button>
          </div>
        </div>
      </section>

      <article
        ref={contentRef}
        className="document-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
}
