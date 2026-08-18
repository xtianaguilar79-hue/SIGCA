import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("sigca_generar_recordatorios");

  if (error) {
    console.error("Error al generar recordatorios:", error.message);
    return NextResponse.json({ error: "No se pudieron generar los recordatorios." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, generated: data ?? 0 });
}

