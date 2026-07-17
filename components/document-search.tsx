"use client";

import {
  FormEvent,
  memo,
  useEffect,
  useRef,
  useState,
} from "react";

const StaticDocument = memo(function StaticDocument({
  html,
  documentRef,
}: {
  html: string;
  documentRef: React.RefObject<HTMLElement | null>;
}) {
  return (
    <article
      ref={documentRef}
      className="document-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

export function DocumentSearch({ html }: { html: string }) {
  const documentRef = useRef<HTMLElement>(null);
  const matchesRef = useRef<HTMLElement[]>([]);
  const currentRef = useRef(-1);

  const [query, setQuery] = useState("");
  const [counter, setCounter] = useState("0 resultados");

  function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function clearHighlights() {
    const container = documentRef.current;
    if (!container) return;

    container
      .querySelectorAll("mark.document-search-match")
      .forEach((mark) => {
        mark.replaceWith(
          document.createTextNode(mark.textContent || "")
        );
      });

    container.normalize();
    matchesRef.current = [];
    currentRef.current = -1;
  }

  function showMatch(index: number) {
    const matches = matchesRef.current;

    if (!matches.length) {
      setCounter("0 resultados");
      return;
    }

    const newIndex = (index + matches.length) % matches.length;
    currentRef.current = newIndex;

    matches.forEach((match) => {
      match.classList.remove("document-search-current");
      match.removeAttribute("aria-current");
      match.removeAttribute("tabindex");
    });

    const selected = matches[newIndex];

    selected.classList.add("document-search-current");
    selected.setAttribute("aria-current", "true");
    selected.setAttribute("tabindex", "-1");

    setCounter(`${newIndex + 1} de ${matches.length}`);

    selected.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });

    window.setTimeout(() => {
      selected.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });

      selected.focus({ preventScroll: true });
    }, 250);
  }

  function performSearch(event?: FormEvent) {
    event?.preventDefault();

    const container = documentRef.current;
    const term = query.trim();

    clearHighlights();
    setCounter("0 resultados");

    if (!container || !term) return;

    const normalizedTerm = term.toLocaleLowerCase("es");

    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const parent = node.parentElement;
          const text = node.textContent || "";

          if (!parent || !text.trim()) {
            return NodeFilter.FILTER_REJECT;
          }

          if (
            parent.closest(
              "script, style, mark, button, input, textarea, select"
            )
          ) {
            return NodeFilter.FILTER_REJECT;
          }

          return text
            .toLocaleLowerCase("es")
            .includes(normalizedTerm)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        },
      }
    );

    const textNodes: Text[] = [];
    let currentNode: Node | null;

    while ((currentNode = walker.nextNode())) {
      textNodes.push(currentNode as Text);
    }

    const expression = new RegExp(
      `(${escapeRegExp(term)})`,
      "giu"
    );

    textNodes.forEach((textNode) => {
      const originalText = textNode.textContent || "";
      const parts = originalText.split(expression);

      if (parts.length === 1) return;

      const fragment = document.createDocumentFragment();

      parts.forEach((part) => {
        if (!part) return;

        if (
          part.toLocaleLowerCase("es") === normalizedTerm
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

    matchesRef.current = Array.from(
      container.querySelectorAll<HTMLElement>(
        "mark.document-search-match"
      )
    );

    if (matchesRef.current.length) {
      showMatch(0);
    }
  }

  useEffect(() => {
    return () => {
      clearHighlights();
    };
  }, []);

  return (
    <>
      <form
        className="document-search"
        onSubmit={performSearch}
      >
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
              placeholder="Buscar una palabra…"
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
            <span aria-live="polite">{counter}</span>

            <button
              type="button"
              className="document-search-arrow"
              onClick={() =>
                showMatch(currentRef.current - 1)
              }
              disabled={!matchesRef.current.length}
              aria-label="Resultado anterior"
            >
              {"<"}
            </button>

            <button
              type="button"
              className="document-search-arrow"
              onClick={() =>
                showMatch(currentRef.current + 1)
              }
              disabled={!matchesRef.current.length}
              aria-label="Resultado siguiente"
            >
              {">"}
            </button>
          </div>
        </div>
      </form>

      <StaticDocument
        html={html}
        documentRef={documentRef}
      />
    </>
  );
}
