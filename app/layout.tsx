import type { Metadata } from "next";
import "./globals.css";
import "./formation.css";
import "./profile.css";

export const metadata: Metadata = {
  title: "SIGCA | AOMA Seccional San Juan",
  description: "Sistema Integral de Gestión, Capacitación y Administración Sindical.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
