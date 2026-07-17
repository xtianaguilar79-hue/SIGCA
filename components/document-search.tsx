"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

export function DocumentSearch({ html }: { html: string }) {
  const contentRef = useRef<HTMLElement>(null);

  const [inputValue, setInputValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [resultCount, setResultCount] = useState(0);
  const [activeResult, setActiveResult] = useState(0);

  function getMarks() {
    return contentRef.current?.querySelectorAll<HTMLElement>(
      ".document-search-mark",
    );
  }

  function moveToResult(index: number) {
    const marks = getMarks();

    if (!marks || !marks.length) {
      return;
    }

    const safeIndex =
      ((index % marks.length) + marks.length) % marks.length;

    marks.forEach((mark) => {
      mark.classList.remove("document-search-mark-active");
    });

    const selectedMark = marks[safeIndex];

    selectedMark.classList.add(
      "document-search-mark-active",
    );

    setActiveResult(safeIndex);

    selectedMark.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });

    window.setTimeout(() => {
      selectedMark.focus({
        preventScroll: true,
      });
    }, 450);
  }

  useEffect(() => {
    const container = contentRef.current;

    if (!container) {
      return;
    }

    container.innerHTML = html;

    const term = searchTerm.trim();

    if (term.length < 2) {
      setResultCount(0);
      setActiveResult(0);
      return;
    }

    const escapedTerm = term.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );

    const expression = new RegExp(
      `(${escapedTerm})`,
      "gi",
    );

    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
    );

    const nodes: Text[] = [];
    let currentNode = walker.nextNode();

    while (currentNode) {
      const parent = currentNode.parentElement;
      const text = currentNode.textContent || "";

      if (
        parent &&
        !["SCRIPT", "STYLE", "MARK"].includes(
          parent.tagName,
        ) &&
        text.toLowerCase().includes(term.toLowerCase())
      ) {
        nodes.push(currentNode as Text);
      }

      currentNode = walker.nextNode();
    }

    nodes.forEach((textNode) => {
      const text = textNode.textContent || "";
      const parts = text.split(expression);

      if (parts.length <= 1) {
        return;
      }

      const fragment =
        document.createDocumentFragment();

      parts.forEach((part) => {
        if (part.toLowerCase() === term.toLowerCase()) {
          const mark = document.createElement("mark");

          mark.className = "document-search-mark";
          mark.textContent = part;
          mark.tabIndex = -1;

          fragment.appendChild(mark);
        } else {
          fragment.appendChild(
            document.createTextNode(part),
          );
        }
      });

      textNode.parentNode?.replaceChild(
        fragment,
        textNode,
      );
    });

    const marks = container.querySelectorAll<HTMLElement>(
      ".document-search-mark",
    );

    setResultCount(marks.length);
    setActiveResult(0);

    if (marks.length) {
      window.setTimeout(() => {
        moveToResult(0);
      }, 100);
    }
  }, [html, searchTerm]);

  function submitSearch(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const newTerm = inputValue.trim();

    if (newTerm.length < 2) {
      setSearchTerm("");
      return;
    }

    if (newTerm === searchTerm) {
      moveToResult(0);
      return;
    }

    setSearchTerm(newTerm);
  }

  function previousResult() {
    moveToResult(activeResult - 1);
  }

  function nextResult() {
    moveToResult(activeResult + 1);
  }

  function clearSearch() {
    setInputValue("");
    setSearchTerm("");
    setResultCount(0);
    setActiveResult(0);

    if (contentRef.current) {
      contentRef.current.innerHTML = html;
    }
  }

  return (
    <>
      <section
        className="document-search document-search-compact"
        aria-label="Buscar dentro del documento"
      >
        <form
          className="document-search-bar"
          onSubmit={submitSearch}
        >
          <label
            className="document-search-hidden-label"
            htmlFor="document-search-input"
          >
            Buscar dentro del documento
          </label>

          <input
            id="document-search-input"
            type="search"
            value={inputValue}
            onChange={(event) =>
              setInputValue(event.target.value)
            }
            placeholder="Buscar dentro del documento..."
          />

          {inputValue && (
            <button
              type="button"
              className="document-search-icon-button"
              onClick={clearSearch}
              aria-label="Limpiar búsqueda"
              title="Limpiar búsqueda"
            >
              ×
            </button>
          )}

          <button
            type="submit"
            className="document-search-submit"
            aria-label="Buscar"
            title="Buscar"
          >
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" />
            </svg>
          </button>
        </form>

        <div className="document-search-results">
          <span aria-live="polite">
            {!searchTerm
              ? "Ingresá una palabra"
              : resultCount
                ? `${activeResult + 1} de ${resultCount}`
                : "Sin resultados"}
          </span>

          <button
            type="button"
            className="document-search-arrow"
            onClick={previousResult}
            disabled={!resultCount}
            aria-label="Coincidencia anterior"
            title="Coincidencia anterior"
          >
            ←
          </button>

          <button
            type="button"
            className="document-search-arrow"
            onClick={nextResult}
            disabled={!resultCount}
            aria-label="Coincidencia siguiente"
            title="Coincidencia siguiente"
          >
            →
          </button>
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
