import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getPayDunyaConfig } from "@/lib/payments/config";
import { confirmPayDunyaCheckout } from "@/lib/payments/paydunya";
import { createPaymentAdminClient } from "@/lib/payments/supabase-server";

function constantTimeMatch(left: string, right: string) {
  const a = Buffer.from(left.toLowerCase());
  const b = Buffer.from(right.toLowerCase());
  return a.length === b.length && timingSafeEqual(a, b);
}

function callbackFields(raw: string) {
  const params = new URLSearchParams(raw);
  let nested: Record<string, unknown> = {};
  const data = params.get("data");
  if (data) {
    try {
      nested = JSON.parse(data) as Record<string, unknown>;
    } catch {
      nested = {};
    }
  }
  const invoice = typeof nested.invoice === "object" && nested.invoice
    ? nested.invoice as Record<string, unknown>
    : {};
  return {
    hash: String(nested.hash ?? params.get("data[hash]") ?? ""),
    status: String(nested.status ?? params.get("data[status]") ?? "").toLowerCase(),
    token: String(invoice.token ?? params.get("data[invoice][token]") ?? ""),
  };
}

export async function POST(request: Request) {
  const config = getPayDunyaConfig();
  const admin = createPaymentAdminClient();
  if (!config || !admin) {
    return NextResponse.json({ code: "PAYMENTS_NOT_CONFIGURED" }, { status: 503 });
  }

  const raw = await request.text();
  const fields = callbackFields(raw);
  const payloadHash = createHash("sha256").update(raw).digest("hex");
  const expectedHash = createHash("sha512").update(config.masterKey).digest("hex");
  const signatureValid = Boolean(fields.hash) && constantTimeMatch(fields.hash, expectedHash);
  const eventId = fields.token
    ? `${fields.token}:${fields.status || "unknown"}`
    : `invalid:${payloadHash}`;

  await admin.from("payment_webhook_inbox").upsert(
    {
      provider: "paydunya",
      event_id: eventId,
      event_type: fields.status || "unknown",
      payload: { form: Object.fromEntries(new URLSearchParams(raw)) },
      payload_sha256: payloadHash,
      signature_valid: signatureValid,
      processing_status: signatureValid ? "received" : "failed",
      last_error: signatureValid ? null : "invalid_signature",
    },
    { onConflict: "provider,event_id", ignoreDuplicates: true },
  );

  if (!signatureValid || !fields.token) {
    return NextResponse.json({ code: "INVALID_SIGNATURE" }, { status: 400 });
  }

  try {
    const confirmation = await confirmPayDunyaCheckout(config, fields.token);
    const confirmationHash = String(confirmation.hash ?? "");
    if (!confirmationHash || !constantTimeMatch(confirmationHash, expectedHash)) {
      throw new Error("invalid_confirmation_signature");
    }

    const { data: order, error: orderError } = await admin
      .from("payment_orders")
      .select("id, amount, status")
      .eq("provider", "paydunya")
      .eq("provider_reference", fields.token)
      .single();
    if (orderError || !order) throw new Error("payment_order_not_found");

    const confirmedAmount = Number(confirmation.invoice?.total_amount);
    if (!Number.isFinite(confirmedAmount) || confirmedAmount !== Number(order.amount)) {
      throw new Error("payment_amount_mismatch");
    }

    const status = String(confirmation.status ?? "").toLowerCase();
    if (status !== "completed") {
      const paymentStatus = status === "pending" ? "pending" : "cancelled";
      await admin
        .from("payment_orders")
        .update({ status: paymentStatus, updated_at: new Date().toISOString() })
        .eq("id", order.id)
        .neq("status", "paid");
      await admin
        .from("payment_webhook_inbox")
        .update({
          processing_status: "ignored",
          processed_at: new Date().toISOString(),
          attempts: 1,
        })
        .eq("provider", "paydunya")
        .eq("event_id", eventId);
      return NextResponse.json({ received: true });
    }

    const { error: processingError } = await admin.rpc("process_successful_payment", {
      p_order_id: order.id,
      p_provider_reference: fields.token,
      p_event_id: eventId,
    });
    if (processingError) throw processingError;
    return NextResponse.json({ received: true });
  } catch {
    await admin
      .from("payment_webhook_inbox")
      .update({
        processing_status: "failed",
        attempts: 1,
        last_error: "verification_or_processing_failed",
      })
      .eq("provider", "paydunya")
      .eq("event_id", eventId);
    return NextResponse.json({ code: "WEBHOOK_PROCESSING_FAILED" }, { status: 500 });
  }
}
