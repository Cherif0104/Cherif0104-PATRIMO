import assert from "node:assert/strict";
import test from "node:test";
import { confirmPayDunyaCheckout, createPayDunyaCheckout } from "./paydunya";
import type { PayDunyaConfig } from "./config";

const config: PayDunyaConfig = {
  masterKey: "master-test",
  privateKey: "private-test",
  token: "token-test",
  mode: "sandbox",
  appUrl: "https://ameena.example",
};

test("le checkout PayDunya transmet les callbacks serveur et retourne l’URL vérifiée", async () => {
  const originalFetch = global.fetch;
  let requestBody: Record<string, unknown> = {};
  global.fetch = (async (input, init) => {
    assert.equal(
      input,
      "https://app.paydunya.com/sandbox-api/v1/checkout-invoice/create",
    );
    requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return Response.json({
      response_code: "00",
      response_text: "https://app.paydunya.com/sandbox-checkout/invoice/test_123",
      token: "test_123",
    });
  }) as typeof fetch;

  try {
    const checkout = await createPayDunyaCheckout(config, {
      orderId: "order-1",
      bookingId: "booking-1",
      title: "Villa test",
      amount: 50_000,
      customer: { name: "Awa Test", email: "awa@example.com" },
    });
    assert.equal(checkout.token, "test_123");
    assert.equal(
      (requestBody.actions as Record<string, string>).callback_url,
      "https://ameena.example/api/payments/webhooks/paydunya",
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test("une réponse ambiguë du PSP n’est jamais traitée comme un succès", async () => {
  const originalFetch = global.fetch;
  global.fetch = (async () => Response.json({
    response_code: "99",
    response_text: "Erreur",
  })) as typeof fetch;
  try {
    await assert.rejects(
      createPayDunyaCheckout(config, {
        orderId: "order-1",
        bookingId: "booking-1",
        title: "Villa test",
        amount: 50_000,
        customer: { name: "Awa Test", email: "awa@example.com" },
      }),
      /paydunya_checkout_failed/,
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test("la confirmation est relue depuis l’API PayDunya", async () => {
  const originalFetch = global.fetch;
  global.fetch = (async (input, init) => {
    assert.equal(
      input,
      "https://app.paydunya.com/sandbox-api/v1/checkout-invoice/confirm/test_123",
    );
    assert.equal(init?.method, "GET");
    return Response.json({
      response_code: "00",
      status: "completed",
      provider_reference: "WAVE-123",
      receipt_identifier: "RECEIPT-123",
      receipt_url: "https://app.paydunya.com/receipt/test_123",
      invoice: { token: "test_123", total_amount: 50_000 },
    });
  }) as typeof fetch;
  try {
    const confirmation = await confirmPayDunyaCheckout(config, "test_123");
    assert.equal(confirmation.status, "completed");
    assert.equal(confirmation.invoice?.total_amount, 50_000);
    assert.equal(confirmation.provider_reference, "WAVE-123");
  } finally {
    global.fetch = originalFetch;
  }
});
