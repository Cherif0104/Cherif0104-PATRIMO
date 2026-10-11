import assert from "node:assert/strict";
import test from "node:test";
import { renderTransactionalEmail, type EmailOutboxRow } from "./transactional-email";

function row(partial: Partial<EmailOutboxRow>): EmailOutboxRow {
  return {
    id: "email-1",
    kind: "booking_guest_created",
    recipient: "client@example.com",
    subject: "Notification",
    payload: {},
    attempts: 1,
    ...partial,
  };
}

test("le rendu échappe les données issues des utilisateurs", () => {
  const html = renderTransactionalEmail(row({
    payload: {
      listing_title: "<script>alert(1)</script>",
      start_date: "2026-10-12",
      end_date: "2026-10-14",
      total: 50_000,
      currency: "XOF",
    },
  }), "https://example.com");

  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /https:\/\/example\.com\/voyages/);
});

test("une invitation contient un lien limité au domaine applicatif", () => {
  const html = renderTransactionalEmail(row({
    kind: "organization_invitation",
    payload: {
      organization_name: "Teranga Immo",
      token: "1234-5678",
    },
  }), "https://example.com/");

  assert.match(html, /Teranga Immo/);
  assert.match(html, /https:\/\/example\.com\/invitation\/1234-5678/);
});
