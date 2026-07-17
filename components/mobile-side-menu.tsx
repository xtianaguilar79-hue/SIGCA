"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function MobileSideMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle(
      "mobile-menu-open",
      open,
    );

    return () => {
      document.documentElement.classList.remove(
        "mobile-menu-open",
      );
    };
  }, [open]);

  useEffect(() => {
    const sidebarLinks =
      document.querySelectorAll<HTMLAnchorElement>(
        ".side nav a",
      );

    sidebarLinks.forEach((link) => {
      if (link.textContent?.trim() === "Afiliaciones") {
        link.hidden = true;
      }
    });

    return () => {
      sidebarLinks.forEach((link) => {
        if (
          link.textContent?.trim() === "Afiliaciones"
        ) {
          link.hidden = false;
        }
      });
    };
  }, []);

  useEffect(() => {
    function handleSidebarSelection(
      event: MouseEvent,
    ) {
      const target = event.target as Element | null;
      const link =
        target?.closest<HTMLAnchorElement>(
          ".side nav a",
        );

      if (
        link?.textContent?.trim() === "Biblioteca" &&
        link.getAttribute("href") === "#"
      ) {
        event.preventDefault();
        window.location.href =
          "/gestion/biblioteca";
      }

      if (
        link?.textContent?.trim() ===
          "Gestión sindical" &&
        link.getAttribute("href") === "#"
      ) {
        event.preventDefault();
        window.location.href =
          "/gestion/sindical";
      }

      if (
        link ||
        target?.closest(".side .sign-out") ||
        target?.closest(".home-brand-link")
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "click",
      handleSidebarSelection,
    );

    return () => {
      document.removeEventListener(
        "click",
        handleSidebarSelection,
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
