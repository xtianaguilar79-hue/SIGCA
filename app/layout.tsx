import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./formation.css";
import "./profile.css";
import "./accessibility.css";
import "./theme.css";
import "./library.css";
import { MobileSideMenu } from "@/components/mobile-side-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "SIGCA | AOMA Seccional San Juan",
  description:
    "Sistema Integral de Gestión, Capacitación y Administración Sindical.",
  manifest: "/manifest.webmanifest",
  applicationName: "SIGCA",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SIGCA",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#003d4c",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <PwaRegister />
        <MobileSideMenu />
        <ThemeToggle />
        <NotificationBell />
        {children}
      </body>
    </html>
  );
}

