import type { Metadata } from "next";
import "./globals.css";
import "./formation.css";
import "./profile.css";
import "./accessibility.css";
import { MobileSideMenu } from "@/components/mobile-side-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import "./theme.css";

export const metadata: Metadata = {
  title: "SIGCA | AOMA Seccional San Juan",
  description: "Sistema Integral de Gestión, Capacitación y Administración Sindical.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es" suppressHydrationWarning><body><MobileSideMenu/><ThemeToggle/>{children}</body></html>;
}
