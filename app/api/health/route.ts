import { NextResponse } from "next/server";
import { getPayDunyaConfig } from "@/lib/payments/config";
import { createServerSupabaseClient } from "@/lib/supabase-server-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  const supabase = await createServerSupabaseClient();
  let database = false;
  if (supabase) {
    const { error } = await supabase
      .from("marketplace_listings")
      .select("id", { count: "exact", head: true })
      .eq("status", "published");
    database = !error;
  }

  const payments = Boolean(
    getPayDunyaConfig()
    && process.env.SUPABASE_SERVICE_ROLE_KEY
    && process.env.APP_URL,
  );
  const transactionalEmail = Boolean(
    process.env.RESEND_API_KEY
    && process.env.TRANSACTIONAL_EMAIL_FROM
    && process.env.CRON_SECRET
    && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  const status = database && payments && transactionalEmail ? "ok" : "degraded";

  return NextResponse.json(
    {
      status,
      checks: {
        database,
        payments,
        transactionalEmail,
      },
      durationMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    },
    {
      status: database ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
