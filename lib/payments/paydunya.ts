import type { PayDunyaConfig } from "./config";

type PayDunyaResponse = {
  response_code?: string;
  response_text?: string;
  token?: string;
  status?: string;
  hash?: string;
  provider_reference?: string;
  receipt_identifier?: string;
  receipt_url?: string;
  invoice?: {
    token?: string;
    total_amount?: number | string;
  };
};

function endpoint(config: PayDunyaConfig) {
  return config.mode === "sandbox"
    ? "https://app.paydunya.com/sandbox-api/v1"
    : "https://app.paydunya.com/api/v1";
}

function headers(config: PayDunyaConfig) {
  return {
    "Content-Type": "application/json",
    "PAYDUNYA-MASTER-KEY": config.masterKey,
    "PAYDUNYA-PRIVATE-KEY": config.privateKey,
    "PAYDUNYA-TOKEN": config.token,
  };
}

export async function createPayDunyaCheckout(
  config: PayDunyaConfig,
  input: {
    orderId: string;
    bookingId: string;
    title: string;
    amount: number;
    customer: { name: string; email: string; phone?: string | null };
  },
) {
  const response = await fetch(`${endpoint(config)}/checkout-invoice/create`, {
    method: "POST",
    headers: headers(config),
    body: JSON.stringify({
      invoice: {
        items: {
          stay: {
            name: input.title,
            quantity: 1,
            unit_price: input.amount,
            total_price: input.amount,
            description: `Réservation Se Loger au Sénégal ${input.bookingId}`,
          },
        },
        customer: {
          name: input.customer.name,
          email: input.customer.email,
          phone: input.customer.phone || "",
        },
        total_amount: input.amount,
        description: `Réservation ${input.title}`,
      },
      store: { name: "Se Loger au Sénégal" },
      custom_data: {
        payment_order_id: input.orderId,
        booking_id: input.bookingId,
      },
      actions: {
        cancel_url: `${config.appUrl}/compte?paiement=annule`,
        return_url: `${config.appUrl}/compte?paiement=retour`,
        callback_url: `${config.appUrl}/api/payments/webhooks/paydunya`,
      },
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  const payload = (await response.json().catch(() => null)) as PayDunyaResponse | null;
  if (
    !response.ok ||
    payload?.response_code !== "00" ||
    !payload.token ||
    !payload.response_text?.startsWith("https://")
  ) {
    throw new Error("paydunya_checkout_failed");
  }

  return { token: payload.token, checkoutUrl: payload.response_text };
}

export async function confirmPayDunyaCheckout(
  config: PayDunyaConfig,
  invoiceToken: string,
) {
  const response = await fetch(
    `${endpoint(config)}/checkout-invoice/confirm/${encodeURIComponent(invoiceToken)}`,
    {
      method: "GET",
      headers: headers(config),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    },
  );
  const payload = (await response.json().catch(() => null)) as PayDunyaResponse | null;
  if (!response.ok || payload?.response_code !== "00") {
    throw new Error("paydunya_confirmation_failed");
  }
  return payload;
}
