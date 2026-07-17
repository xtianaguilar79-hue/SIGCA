"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const navigationData: Record<
  string,
  { href: string; icon: string }
> = {
  "inicio institucional": {
    href: "/gestion",
    icon: "⌂",
  },
  "gestión sindical": {
    href: "/gestion/sindical",
    icon: "◆",
  },
  "formación sindical": {
    href: "/gestion/formacion",
    icon: "▤",
  },
  biblioteca: {
    href: "/gestion/biblioteca",
    icon: "▥",
  },
  "mi perfil": {
    href: "/gestion/perfil",
    icon: "●",
  },
  "administración de usuarios": {
    href: "/gestion/usuarios",
    icon: "⚙",
  },
};

function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function MobileSideMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle(
      "mobile-menu-open",
      open
    );

    return () => {
      document.documentElement.classList.remove(
        "mobile-menu-open"
      );
    };
  }, [open]);

  useEffect(() => {
    function prepareNavigation() {
      const links = document.querySelectorAll<HTMLAnchorElement>(
        ".side nav a"
      );

      links.forEach((link) => {
        const originalText = link.textContent?.trim() || "";
        const normalized = normalizeText(originalText);

        if (normalized === "afiliaciones") {
          link.hidden = true;
          link.style.display = "none";
          link.setAttribute("aria-hidden", "true");
          return;
        }

        const navigationEntry = Object.entries(
          navigationData
        ).find(
          ([label]) =>
            normalizeText(label) === normalized
        );

        if (!navigationEntry) return;

        const [, data] = navigationEntry;

        link.href = data.href;
        link.dataset.navIcon = data.icon;
      });
    }

    prepareNavigation();

    const observer = new MutationObserver(() => {
      prepareNavigation();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    function closeAfterSelection(event: MouseEvent) {
      const target = event.target as Element | null;

      if (
        target?.closest(".side nav a") ||
        target?.closest(".side .sign-out") ||
        target?.closest(".side-brand") ||
        target?.closest(".home-brand-link")
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "click",
      closeAfterSelection
    );

    return () => {
      observer.disconnect();

      document.removeEventListener(
        "click",
        closeAfterSelection
      );
    };
  }, []);

  return (
    <>
      <Link
        className="home-brand-link"
        href="/gestion"
        aria-label="Ir al inicio de SIGCA"
      >
        <span>Ir al inicio</span>
      </Link>

      <button
        className="mobile-menu-button"
        type="button"
        aria-label={
          open ? "Cerrar menú" : "Abrir menú"
        }
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? "×" : "☰"}
      </button>

      {open && (
        <button
          className="mobile-menu-backdrop"
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
