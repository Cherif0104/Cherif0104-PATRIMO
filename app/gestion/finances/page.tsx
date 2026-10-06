"use client";

import { useState } from "react";
import { PageHead, Pill } from "@/components/ui";
import { btnPrimary, fieldClass, formatDate, formatMoney, todayISO, uid } from "@/lib/format";
import { EXPENSE_LABEL, INVOICE_STATUS } from "@/lib/labels";
import { useAmeena, useScope } from "@/lib/store";
import { useTitle } from "@/lib/use-title";
import type { Currency, ExpenseCategory } from "@/lib/types";

export default function FinancesPage() {
  const { dispatch } = useAmeena();
  const scope = useScope();
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState(0);
  const [listingId, setListingId] = useState(scope.listings[0]?.id ?? "");
  const [category, setCategory] = useState<ExpenseCategory>("reparation");
  const [charge, setCharge] = useState(false);
  useTitle("Finances · Ameena");

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
        text="Loyers, séjours, commissions, dépenses et charges refacturables. Les euros et les francs ne sont pas additionnés."
      />
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

      <h2 className="mb-3 mt-10 text-xl font-semibold">Factures</h2>
      <div className="overflow-hidden rounded-3xl border border-[#ebebeb]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#fafafa] text-[#6a6a6a]">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Libellé</th>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Montant</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th />
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
                <td className="px-4 py-3 text-right">
                  {invoice.status !== "payee" && (
                    <button className="text-sm underline" onClick={() => dispatch({ type: "pay-invoice", id: invoice.id })}>
                      Marquer payée
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-3 mt-10 text-xl font-semibold">Dépenses et charges</h2>
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
