import type { Metadata } from "next";
import "./globals.css";
import "./formation.css";
import "./profile.css";
import "./accessibility.css";
import "./theme.css";
import "./library.css";

import { MobileSideMenu } from "@/components/mobile-side-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";

export const metadata: Metadata = {
  title: "SIGCA | AOMA Seccional San Juan",
  description:
    "Sistema Integral de Gestión, Capacitación y Administración Sindical.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <MobileSideMenu />
        <ThemeToggle />
        <NotificationBell />
        {children}
      </body>
    </html>
  );
}
