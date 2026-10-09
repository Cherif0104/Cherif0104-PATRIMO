"use client";

import { useEffect, useState } from "react";
import { PageHead, Pill } from "@/components/ui";
import { btnPrimary, fieldClass, formatDate, formatMoney, todayISO, uid } from "@/lib/format";
import { EXPENSE_LABEL, INVOICE_STATUS } from "@/lib/labels";
import { loadPaymentOrders, loadPayouts, loadRefunds } from "@/lib/supabase";
import { useAmeena, useScope } from "@/lib/store";
import { useTitle } from "@/lib/use-title";
import type { Currency, ExpenseCategory, PaymentOrder, Payout, Refund } from "@/lib/types";

export default function FinancesPage() {
  const { dispatch } = useAmeena();
  const scope = useScope();
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState(0);
  const [listingId, setListingId] = useState(scope.listings[0]?.id ?? "");
  const [category, setCategory] = useState<ExpenseCategory>("reparation");
  const [charge, setCharge] = useState(false);
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

  const currencies: Currency[] = ["XOF", "EUR"];

  function sum(kind: "paid" | "due" | "expense" | "charge", currency: Currency) {
    if (kind === "expense" || kind === "charge") {
      return scope.expenses
        .filter((item) => item.currency === currency && (kind === "expense" ? !item.chargeToTenant : item.chargeToTenant))
        .reduce((total, item) => total + item.amount, 0);
    }
    return scope.invoices
      .filter((item) => item.currency === currency && (kind === "paid" ? item.status === "payee" : item.status !== "payee"))
      .filter((item) => item.kind !== "commission" || kind === "due")
      .reduce((total, item) => total + item.amount, 0);
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

      <div className="mb-3 mt-10">
        <h2 className="text-xl font-semibold">Simulation de gestion locale</h2>
        <p className="mt-1 text-sm text-[#6a6a6a]">Ces factures et dépenses d’exemple ne déclenchent aucun mouvement d’argent réel.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {currencies.map((currency) => {
          const has =
            scope.invoices.some((item) => item.currency === currency) ||
            scope.expenses.some((item) => item.currency === currency);
          if (!has) return null;
          return (
            <div key={currency} className="rounded-3xl border border-[#ebebeb] p-5">
              <p className="text-sm text-[#6a6a6a]">{currency === "XOF" ? "Francs CFA" : "Euros"}</p>
              <dl className="mt-3 space-y-2 text-sm">
                <Line label="Encaissé" value={formatMoney(sum("paid", currency), currency)} />
                <Line label="À encaisser" value={formatMoney(sum("due", currency), currency)} />
                <Line label="Dépenses" value={formatMoney(sum("expense", currency), currency)} />
                <Line label="Charges refacturables" value={formatMoney(sum("charge", currency), currency)} />
              </dl>
            </div>
          );
        })}
      </div>

      <h3 className="mb-3 mt-10 text-lg font-semibold">Factures d’exemple</h3>
      <div className="overflow-hidden rounded-3xl border border-[#ebebeb]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#fafafa] text-[#6a6a6a]">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Libellé</th>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Montant</th>
              <th className="px-4 py-3 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody>
            {scope.invoices.map((invoice) => (
              <tr key={invoice.id} className="border-t border-[#f2f2f2]">
                <td className="px-4 py-3">{formatDate(invoice.date)}</td>
                <td className="px-4 py-3">{invoice.label}</td>
                <td className="px-4 py-3">{invoice.clientName}</td>
                <td className="px-4 py-3">{formatMoney(invoice.amount, invoice.currency)}</td>
                <td className="px-4 py-3">
                  <Pill tone={invoice.status === "payee" ? "good" : invoice.status === "retard" ? "bad" : "warn"}>
                    {INVOICE_STATUS[invoice.status]}
                  </Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="mb-3 mt-10 text-lg font-semibold">Dépenses et charges d’exemple</h3>
      <ul className="space-y-2">
        {scope.expenses.map((expense) => (
          <li key={expense.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#ebebeb] px-4 py-3 text-sm">
            <span>
              <span className="font-medium">{expense.label}</span>
              <span className="text-[#6a6a6a]"> · {EXPENSE_LABEL[expense.category]} · {formatDate(expense.date)}</span>
            </span>
            <span className="flex items-center gap-3">
              {expense.chargeToTenant && <Pill>Refacturable</Pill>}
              <span className="font-medium">{formatMoney(expense.amount, expense.currency)}</span>
            </span>
          </li>
        ))}
      </ul>

      <form
        className="mt-6 grid gap-3 rounded-3xl border border-[#ebebeb] p-5 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!label.trim() || !listingId) return;
          const listing = scope.listings.find((item) => item.id === listingId);
          dispatch({
            type: "add-expense",
            expense: {
              id: uid("dep"),
              listingId,
              label: label.trim(),
              category,
              amount: Number(amount) || 0,
              currency: listing?.currency ?? "XOF",
              date: todayISO(),
              chargeToTenant: charge,
            },
          });
          setLabel("");
          setAmount(0);
          setCharge(false);
        }}
      >
        <h3 className="md:col-span-2 font-semibold">Ajouter une dépense</h3>
        <select className={fieldClass} value={listingId} onChange={(event) => setListingId(event.target.value)}>
          {scope.listings.map((listing) => (
            <option key={listing.id} value={listing.id}>{listing.title}</option>
          ))}
        </select>
        <select className={fieldClass} value={category} onChange={(event) => setCategory(event.target.value as ExpenseCategory)}>
          {Object.entries(EXPENSE_LABEL).map(([value, name]) => (
            <option key={value} value={value}>{name}</option>
          ))}
        </select>
        <input className={fieldClass} placeholder="Libellé" value={label} onChange={(event) => setLabel(event.target.value)} />
        <input className={fieldClass} type="number" min={0} value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={charge} onChange={(event) => setCharge(event.target.checked)} />
          Charge à refacturer au locataire
        </label>
        <button className={btnPrimary}>Enregistrer</button>
      </form>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt>{label}</dt>
      <dd className="font-medium">{value}</dd>
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
