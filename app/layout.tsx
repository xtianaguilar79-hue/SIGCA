import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Academia AOMA | SIGCA", description: "Formación sindical para dirigentes y delegados de AOMA Seccional San Juan" };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="es-AR"><body>{children}</body></html>; }
