import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createPaymentAdminClient } from "@/lib/payments/supabase-server";
import { serverLog } from "@/lib/server-log";
import { renderTransactionalEmail, type EmailOutboxRow } from "@/lib/transactional-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function matchesSecret(value: string, expected: string) {
  const left = Buffer.from(value);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function GET(request: Request) {
  const startedAt = Date.now();
  const cronSecret = process.env.CRON_SECRET;
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.TRANSACTIONAL_EMAIL_FROM;
  const appUrl = process.env.APP_URL;
  const authorization = request.headers.get("authorization") ?? "";

  if (!cronSecret || !resendKey || !from || !appUrl) {
    serverLog.warn("email.outbox.not_configured");
    return NextResponse.json(
      { code: "EMAIL_NOT_CONFIGURED" },
      { status: 503 },
    );
  }
  if (!matchesSecret(authorization, `Bearer ${cronSecret}`)) {
    return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
  }

  const admin = createPaymentAdminClient();
  if (!admin) {
    return NextResponse.json({ code: "SUPABASE_NOT_CONFIGURED" }, { status: 503 });
  }

  const { data, error } = await admin.rpc("claim_email_outbox", { p_limit: 25 });
  if (error) {
    serverLog.error("email.outbox.claim_failed", { error: error.message });
    return NextResponse.json({ code: "OUTBOX_UNAVAILABLE" }, { status: 503 });
  }

  const resend = new Resend(resendKey);
  const rows = (data ?? []) as EmailOutboxRow[];
  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const result = await resend.emails.send({
        from,
        to: [row.recipient],
        subject: row.subject,
        html: renderTransactionalEmail(row, appUrl),
      });
      if (result.error || !result.data?.id) {
        throw new Error(result.error?.message || "provider_response_invalid");
      }
      const { error: updateError } = await admin
        .from("email_outbox")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          provider_id: result.data.id,
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id)
        .eq("status", "processing");
      if (updateError) throw updateError;
      sent += 1;
    } catch (cause) {
      const terminal = row.attempts >= 5;
      const retryDelaySeconds = Math.min(3600, 60 * (2 ** Math.max(0, row.attempts - 1)));
      const { error: updateError } = await admin
        .from("email_outbox")
        .update({
          status: terminal ? "failed" : "queued",
          available_at: new Date(Date.now() + retryDelaySeconds * 1000).toISOString(),
          last_error: cause instanceof Error ? cause.message.slice(0, 500) : "unknown",
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id)
        .eq("status", "processing");
      if (updateError) {
        serverLog.error("email.outbox.release_failed", {
          emailId: row.id,
          error: updateError.message,
        });
      }
      failed += 1;
    }
  }

  serverLog.info("email.outbox.processed", {
    durationMs: Date.now() - startedAt,
    failed,
    claimed: rows.length,
    sent,
  });
  return NextResponse.json({ claimed: rows.length, sent, failed });
}
