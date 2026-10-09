"use client";

import { useEffect, useState } from "react";
import { PageHead, Pill } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { btnPrimary, fieldClass, formatDate, formatMoney, todayISO } from "@/lib/format";
import { EXPENSE_LABEL } from "@/lib/labels";
import { createPropertyExpense, loadPaymentOrders, loadPayouts, loadPropertyExpenses, loadRefunds } from "@/lib/supabase";
import { useScope } from "@/lib/store";
import { useTitle } from "@/lib/use-title";
import type { Currency, ExpenseCategory, PaymentOrder, Payout, PropertyExpense, Refund } from "@/lib/types";

export default function FinancesPage() {
  const { user } = useAuth();
  const scope = useScope();
  const [payments, setPayments] = useState<PaymentOrder[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [expenses, setExpenses] = useState<PropertyExpense[]>([]);
  const [listingId, setListingId] = useState("");
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("reparation");
  const [amount, setAmount] = useState(0);
  const [chargeToTenant, setChargeToTenant] = useState(false);
  const [busy, setBusy] = useState(false);
  const [onlineLoading, setOnlineLoading] = useState(true);
  const [onlineError, setOnlineError] = useState("");
  useTitle("Finances · Se Loger au Sénégal");

  useEffect(() => {
    Promise.all([loadPaymentOrders(), loadPayouts(), loadRefunds(), loadPropertyExpenses()])
      .then(([paymentRows, payoutRows, refundRows, expenseRows]) => {
        setPayments(paymentRows);
        setPayouts(payoutRows);
        setRefunds(refundRows);
        setExpenses(expenseRows);
      })
      .catch(() => setOnlineError("Les flux financiers sécurisés ne peuvent pas être chargés."))
      .finally(() => setOnlineLoading(false));
  }, []);

  useEffect(() => {
    if (!listingId && scope.listings[0]?.databaseId) setListingId(scope.listings[0].databaseId);
  }, [listingId, scope.listings]);

  async function addExpense(event: React.FormEvent) {
    event.preventDefault();
    const listing = scope.listings.find((item) => item.databaseId === listingId);
    if (!user || !listing || !label.trim() || amount <= 0) return;
    setBusy(true);
    setOnlineError("");
    try {
      const expense = await createPropertyExpense({
        listingId,
        userId: user.id,
        label,
        category,
        amount,
        currency: listing.currency,
        date: todayISO(),
        chargeToTenant,
      });
      setExpenses((rows) => [expense, ...rows]);
      setLabel("");
      setAmount(0);
      setChargeToTenant(false);
    } catch {
      setOnlineError("La dépense n’a pas pu être enregistrée.");
    } finally {
      setBusy(false);
    }
  }

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

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Dépenses opérationnelles</h2>
        <p className="mt-1 text-sm text-[#6a6a6a]">Chaque écriture est rattachée à un bien et enregistrée dans le registre serveur.</p>
        <form onSubmit={addExpense} className="mt-4 grid gap-3 rounded-3xl border border-[#ebebeb] p-5 md:grid-cols-2">
          <select className={fieldClass} value={listingId} onChange={(event) => setListingId(event.target.value)} required>
            <option value="">Choisir un bien</option>
            {scope.listings.map((listing) => listing.databaseId && (
              <option key={listing.databaseId} value={listing.databaseId}>{listing.title}</option>
            ))}
          </select>
          <select className={fieldClass} value={category} onChange={(event) => setCategory(event.target.value as ExpenseCategory)}>
            {Object.entries(EXPENSE_LABEL).map(([value, name]) => <option key={value} value={value}>{name}</option>)}
          </select>
          <input className={fieldClass} value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Libellé de la dépense" minLength={2} required />
          <input className={fieldClass} type="number" min={1} value={amount} onChange={(event) => setAmount(Number(event.target.value))} required />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={chargeToTenant} onChange={(event) => setChargeToTenant(event.target.checked)} />
            Charge refacturable au locataire
          </label>
          <button className={btnPrimary} disabled={busy || !listingId || !label.trim() || amount <= 0}>{busy ? "Enregistrement…" : "Ajouter la dépense"}</button>
        </form>
        <div className="mt-4 grid gap-2">
          {expenses.map((expense) => {
            const listing = scope.listings.find((item) => item.databaseId === expense.listing_id);
            return (
              <article key={expense.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#ebebeb] p-4 text-sm">
                <div>
                  <p className="font-semibold">{expense.label}</p>
                  <p className="text-[#6a6a6a]">{listing?.title} · {EXPENSE_LABEL[expense.category]} · {formatDate(expense.expense_date)}</p>
                </div>
                <div className="flex items-center gap-3">
                  {expense.charge_to_tenant && <Pill>Refacturable</Pill>}
                  <strong>{formatMoney(Number(expense.amount), expense.currency)}</strong>
                </div>
              </article>
            );
          })}
          {expenses.length === 0 && <p className="rounded-2xl border border-dashed border-[#cccccc] p-4 text-sm text-[#6a6a6a]">Aucune dépense enregistrée.</p>}
        </div>
      </section>
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
