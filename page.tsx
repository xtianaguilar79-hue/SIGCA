import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIGCA | AOMA Seccional San Juan",
  description: "Sistema Integral de Gestión, Capacitación y Administración Sindical.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
