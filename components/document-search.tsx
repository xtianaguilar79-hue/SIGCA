"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

export function DocumentSearch({ html }: { html: string }) {
  const documentRef = useRef<HTMLElement>(null);
  const matchesRef = useRef<HTMLElement[]>([]);

  const [query, setQuery] = useState("");
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(-1);

  function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function clearHighlights() {
    const container = documentRef.current;
    if (!container) return;

    container.querySelectorAll("mark.document-search-match").forEach((mark) => {
      mark.replaceWith(document.createTextNode(mark.textContent || ""));
    });

    container.normalize();
    matchesRef.current = [];
  }

  function goToMatch(index: number) {
    const matches = matchesRef.current;
    if (!matches.length) return;

    const normalizedIndex = (index + matches.length) % matches.length;

    matches.forEach((match) => {
      match.classList.remove("document-search-current");
      match.removeAttribute("aria-current");
    });

    const selected = matches[normalizedIndex];
    selected.classList.add("document-search-current");
    selected.setAttribute("aria-current", "true");

    setCurrent(normalizedIndex);

    requestAnimationFrame(() => {
      selected.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    });
  }

  function performSearch(event?: FormEvent) {
    event?.preventDefault();

    const container = documentRef.current;
    const term = query.trim();

    clearHighlights();
    setTotal(0);
    setCurrent(-1);

    if (!container || !term) return;

    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const text = node.textContent || "";
          const parent = node.parentElement;

          if (!text.trim() || !parent) {
            return NodeFilter.FILTER_REJECT;
          }

          if (
            parent.closest(
              "script, style, mark, button, input, textarea, select"
            )
          ) {
            return NodeFilter.FILTER_REJECT;
          }

          return text.toLocaleLowerCase("es").includes(
            term.toLocaleLowerCase("es")
          )
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        },
      }
    );

    const textNodes: Text[] = [];
    let node: Node | null;

    while ((node = walker.nextNode())) {
      textNodes.push(node as Text);
    }

    const expression = new RegExp(`(${escapeRegExp(term)})`, "giu");

    textNodes.forEach((textNode) => {
      const text = textNode.textContent || "";
      const parts = text.split(expression);

      if (parts.length === 1) return;

      const fragment = document.createDocumentFragment();

      parts.forEach((part) => {
        if (!part) return;

        if (
          part.toLocaleLowerCase("es") === term.toLocaleLowerCase("es")
        ) {
          const mark = document.createElement("mark");
          mark.className = "document-search-match";
          mark.textContent = part;
          fragment.appendChild(mark);
        } else {
          fragment.appendChild(document.createTextNode(part));
        }
      });

      textNode.replaceWith(fragment);
    });

    const matches = Array.from(
      container.querySelectorAll<HTMLElement>(
        "mark.document-search-match"
      )
    );

    matchesRef.current = matches;
    setTotal(matches.length);

    if (matches.length > 0) {
      goToMatch(0);
    }
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      performSearch();
    }

    if (event.key === "Escape") {
      setQuery("");
      clearHighlights();
      setTotal(0);
      setCurrent(-1);
    }
  }

  useEffect(() => {
    return () => clearHighlights();
  }, []);

  return (
    <>
      <form className="document-search" onSubmit={performSearch}>
        <label htmlFor="document-search-input">
          Buscar dentro del documento
        </label>

        <div className="document-search-controls">
          <div className="document-search-field">
            <input
              id="document-search-input"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Escribí una palabra…"
              aria-label="Palabra que se buscará dentro del documento"
            />

            <button
              type="submit"
              className="document-search-submit"
              aria-label="Buscar"
              title="Buscar"
            >
              🔍
            </button>
          </div>

          <div className="document-search-navigation">
            <span aria-live="polite">
              {total > 0 ? `${current + 1} de ${total}` : "0 resultados"}
            </span>

            <button
              type="button"
              onClick={() => goToMatch(current - 1)}
              disabled={total === 0}
              aria-label="Resultado anterior"
              title="Resultado anterior"
            >
              ←
            </button>

            <button
              type="button"
              onClick={() => goToMatch(current + 1)}
              disabled={total === 0}
              aria-label="Resultado siguiente"
              title="Resultado siguiente"
            >
              →
            </button>
          </div>
        </div>
      </form>

      <article
        ref={documentRef}
        className="document-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
}
