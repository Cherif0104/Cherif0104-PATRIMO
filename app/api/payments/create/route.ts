import { NextResponse } from "next/server";
import { getPayDunyaConfig } from "@/lib/payments/config";
import { createPayDunyaCheckout } from "@/lib/payments/paydunya";
import {
  createPaymentAdminClient,
  createTokenVerifier,
} from "@/lib/payments/supabase-server";
import type { PaymentOrder } from "@/lib/types";

const METHODS = new Set(["hosted_checkout"]);

export async function POST(request: Request) {
  const config = getPayDunyaConfig();
  const admin = createPaymentAdminClient();
  const verifier = createTokenVerifier();
  if (!config || !admin || !verifier) {
    return NextResponse.json(
      { code: "PAYMENTS_NOT_CONFIGURED", message: "Le paiement est en cours d’activation." },
      { status: 503 },
    );
  }

  const bearer = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!bearer) {
    return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
  }
  const { data: authData, error: authError } = await verifier.auth.getUser(bearer);
  if (authError || !authData.user) {
    return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    bookingId?: string;
    paymentMethod?: string;
  } | null;
  if (!body?.bookingId || !body.paymentMethod || !METHODS.has(body.paymentMethod)) {
    return NextResponse.json({ code: "INVALID_REQUEST" }, { status: 400 });
  }

  const { data: booking, error: bookingError } = await admin
    .from("booking_requests")
    .select("id, listing_title, guest_name, guest_phone, total, currency")
    .eq("id", body.bookingId)
    .eq("guest_id", authData.user.id)
    .single();
  if (bookingError || !booking) {
    return NextResponse.json({ code: "BOOKING_NOT_PAYABLE" }, { status: 409 });
  }
  if (booking.currency !== "XOF") {
    return NextResponse.json(
      { code: "CURRENCY_NOT_SUPPORTED", message: "Ce moyen de paiement accepte actuellement le XOF." },
      { status: 422 },
    );
  }

  const suppliedKey = request.headers.get("idempotency-key");
  const idempotencyKey = suppliedKey?.match(/^[A-Za-z0-9:_-]{8,120}$/)
    ? suppliedKey
    : `checkout:${body.bookingId}:${authData.user.id}`;

  await admin.rpc("expire_payment_holds");
  const { data: order, error: orderError } = await admin
    .rpc("create_payment_order", {
      p_booking_id: body.bookingId,
      p_payer_id: authData.user.id,
      p_provider: "paydunya",
      p_payment_method: body.paymentMethod,
      p_idempotency_key: idempotencyKey,
    })
    .single();

  if (orderError || !order) {
    const expired = orderError?.message.includes("booking_hold_expired");
    return NextResponse.json(
      {
        code: expired ? "BOOKING_HOLD_EXPIRED" : "BOOKING_NOT_PAYABLE",
        message: expired
          ? "Le délai de paiement est dépassé. Demandez une nouvelle préapprobation."
          : "Cette réservation ne peut pas être payée.",
      },
      { status: 409 },
    );
  }
  const paymentOrder = order as PaymentOrder;

  if (paymentOrder.checkout_url && paymentOrder.checkout_token) {
    return NextResponse.json({
      checkoutUrl: paymentOrder.checkout_url,
      orderId: paymentOrder.id,
    });
  }

  try {
    const checkout = await createPayDunyaCheckout(config, {
      orderId: paymentOrder.id,
      bookingId: booking.id,
      title: booking.listing_title,
      amount: Number(booking.total),
      customer: {
        name: booking.guest_name,
        email: authData.user.email ?? "",
        phone: booking.guest_phone,
      },
    });
    const { error: updateError } = await admin
      .from("payment_orders")
      .update({
        checkout_token: checkout.token,
        checkout_url: checkout.checkoutUrl,
        status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentOrder.id)
      .eq("status", "created");
    if (updateError) throw updateError;

    return NextResponse.json({
      checkoutUrl: checkout.checkoutUrl,
      orderId: paymentOrder.id,
    });
  } catch {
    return NextResponse.json(
      {
        code: "PAYMENT_PROVIDER_UNAVAILABLE",
        message: "Le prestataire de paiement est momentanément indisponible.",
      },
      { status: 502 },
    );
  }
}
