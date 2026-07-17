"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const mainNavigation = [
  {
    label: "Inicio institucional",
    href: "/gestion",
    icon: "⌂",
  },
  {
    label: "Gestión sindical",
    href: "/gestion/sindical",
    icon: "◆",
  },
  {
    label: "Formación Sindical",
    href: "/gestion/formacion",
    icon: "▤",
  },
  {
    label: "Biblioteca",
    href: "/gestion/biblioteca",
    icon: "▥",
  },
  {
    label: "Mi perfil",
    href: "/gestion/perfil",
    icon: "●",
  },
];

const adminNavigation = {
  label: "Administración de usuarios",
  href: "/gestion/usuarios",
  icon: "⚙",
};

function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isCurrentRoute(
  currentPath: string,
  href: string
) {
  if (href === "/gestion") {
    return currentPath === "/gestion";
  }

  return (
    currentPath === href ||
    currentPath.startsWith(`${href}/`)
  );
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
    let preparing = false;

    function prepareNavigation() {
      if (preparing) return;

      preparing = true;

      const currentPath = window.location.pathname;

      document
        .querySelectorAll<HTMLElement>(".side")
        .forEach((side) => {
          const nav =
            side.querySelector<HTMLElement>("nav");

          if (!nav) return;

          const currentLinks = Array.from(
            nav.querySelectorAll<HTMLAnchorElement>("a")
          );

          const sessionRole =
            side
              .querySelector(".session span")
              ?.textContent?.trim() || "";

          const hasAdminLink = currentLinks.some(
            (link) =>
              normalizeText(link.textContent || "") ===
              normalizeText(
                "Administración de usuarios"
              )
          );

          const isAdministrator =
            normalizeText(sessionRole).includes(
              "administrador"
            );

          const navigationItems = [
            ...mainNavigation,
            ...(hasAdminLink || isAdministrator
              ? [adminNavigation]
              : []),
          ];

          const expectedSignature = navigationItems
            .map((item) => item.href)
            .join("|");

          const currentSignature = currentLinks
            .filter(
              (link) =>
                normalizeText(link.textContent || "") !==
                "afiliaciones"
            )
            .map((link) => {
              const url = new URL(
                link.href,
                window.location.origin
              );

              return url.pathname;
            })
            .join("|");

          if (currentSignature !== expectedSignature) {
            const fragment =
              document.createDocumentFragment();

            navigationItems.forEach((item) => {
              const link =
                document.createElement("a");

              link.href = item.href;
              link.textContent = item.label;
              link.dataset.navIcon = item.icon;

              if (
                isCurrentRoute(
                  currentPath,
                  item.href
                )
              ) {
                link.classList.add("active");
                link.setAttribute(
                  "aria-current",
                  "page"
                );
              }

              fragment.appendChild(link);
            });

            nav.replaceChildren(fragment);
          } else {
            currentLinks.forEach((link) => {
              const item = navigationItems.find(
                (navigationItem) => {
                  const url = new URL(
                    link.href,
                    window.location.origin
                  );

                  return (
                    url.pathname ===
                    navigationItem.href
                  );
                }
              );

              if (!item) return;

              link.textContent = item.label;
              link.href = item.href;
              link.dataset.navIcon = item.icon;

              const active = isCurrentRoute(
                currentPath,
                item.href
              );

              link.classList.toggle(
                "active",
                active
              );

              if (active) {
                link.setAttribute(
                  "aria-current",
                  "page"
                );
              } else {
                link.removeAttribute(
                  "aria-current"
                );
              }
            });
          }
        });

      preparing = false;
    }

    prepareNavigation();

    const observer = new MutationObserver(() => {
      window.requestAnimationFrame(
        prepareNavigation
      );
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
