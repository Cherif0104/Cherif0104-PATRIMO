"use client";

import { useEffect, useState } from "react";
import { PageHead } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { loadPaymentOrders, loadPayouts, loadRefunds } from "@/lib/supabase";
import { useTitle } from "@/lib/use-title";
import type { Currency, PaymentOrder, Payout, Refund } from "@/lib/types";

export default function FinancesPage() {
  const [payments, setPayments] = useState<PaymentOrder[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [onlineLoading, setOnlineLoading] = useState(true);
  const [onlineError, setOnlineError] = useState("");
  useTitle("Finances · Se Loger au Sénégal");

  useEffect(() => {
    Promise.all([loadPaymentOrders(), loadPayouts(), loadRefunds()])
      .then(([paymentRows, payoutRows, refundRows]) => {
        setPayments(paymentRows);
        setPayouts(payoutRows);
        setRefunds(refundRows);
      })
      .catch(() => setOnlineError("Les flux financiers sécurisés ne peuvent pas être chargés."))
      .finally(() => setOnlineLoading(false));
  }, []);

  return (
    <div>
      <PageHead
        title="Finances"
        text="Les paiements, remboursements et reversements réels proviennent exclusivement du registre PSP sécurisé."
      />
      <section className="rounded-3xl border border-[#d8e8e5] bg-[#f6fbfa] p-5">
        <h2 className="text-xl font-semibold">Flux réels PSP</h2>
        <p className="mt-1 text-sm text-[#52706c]">Aucun statut ne peut être marqué payé manuellement depuis cet écran.</p>
        {onlineLoading && <p className="mt-4 text-sm">Chargement…</p>}
        {onlineError && <p role="alert" className="mt-4 text-sm text-[#a52a12]">{onlineError}</p>}
        {!onlineLoading && !onlineError && (
          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <FinancialList
              title="Paiements"
              empty="Aucun paiement PSP."
              rows={payments.map((payment) => ({
                id: payment.id,
                label: `Commande ${payment.id.slice(0, 8)}`,
                value: formatMoney(payment.amount, payment.currency),
                status: payment.status,
              }))}
            />
            <FinancialList
              title="Reversements"
              empty="Aucun reversement planifié."
              rows={payouts.map((payout) => ({
                id: payout.id,
                label: `Vers ${payout.destination_masked}`,
                value: formatMoney(fromMinor(payout.amount_minor, payout.currency), payout.currency),
                status: payout.status,
              }))}
            />
            <FinancialList
              title="Remboursements"
              empty="Aucun remboursement."
              rows={refunds.map((refund) => ({
                id: refund.id,
                label: refund.reason,
                value: formatMoney(fromMinor(refund.amount_minor, refund.currency), refund.currency),
                status: refund.status,
              }))}
            />
          </div>
        )}
      </section>

      <p className="mt-6 rounded-2xl border border-[#d8e8e5] bg-[#f6fbfa] p-4 text-sm text-[#52706c]">
        Les écritures manuelles et données de démonstration ont été retirées. Les dépenses opérationnelles seront disponibles après leur migration vers le registre serveur auditable.
      </p>
    </div>
  );
}

function fromMinor(amount: number, currency: Currency) {
  return currency === "EUR" ? amount / 100 : amount;
}

function FinancialList({
  title,
  empty,
  rows,
}: {
  title: string;
  empty: string;
  rows: Array<{ id: string; label: string; value: string; status: string }>;
}) {
  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-[#6a6a6a]">{empty}</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {rows.map((row) => (
            <li key={row.id} className="rounded-2xl bg-white p-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="truncate">{row.label}</span>
                <strong>{row.value}</strong>
              </div>
              <p className="mt-1 text-xs uppercase tracking-wide text-[#6a6a6a]">{row.status}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
