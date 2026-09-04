import { AsistenteSigca } from "@/components/asistente-sigca";
import "./asistente.css";

export default function GestionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<AsistenteSigca /></>;
}
