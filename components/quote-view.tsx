import { formatMoney } from "@/lib/format";
import type { Quote } from "@/lib/types";

export function QuoteView({ quote }: { quote: Quote }) {
  return (
    <div>
      <dl className="space-y-3 text-[15px]">
        {quote.lines.map((line, index) => (
          <div key={`${line.label}-${index}`} className="flex items-start justify-between gap-6">
            <dt className={index === 0 ? "underline decoration-[#dddddd] underline-offset-[6px]" : "text-[#222]"}>
              {line.label}
            </dt>
            <dd className="shrink-0 font-medium">{formatMoney(line.amount, quote.currency)}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 space-y-3 border-t border-[#ebebeb] pt-4 text-[15px]">
        <Row label="Le client paie" value={formatMoney(quote.guestPays, quote.currency)} strong />
        <Row label="Le propriétaire reçoit" value={formatMoney(quote.ownerReceives, quote.currency)} />
        <Row label="Se Loger au Sénégal perçoit" value={formatMoney(quote.platformReceives, quote.currency)} />
      </div>
      <p className="mt-3 text-xs leading-5 text-[#6a6a6a]">Règle appliquée : {quote.ruleLabel}.</p>
      {quote.warning && <p className="mt-2 text-sm text-[#c13515]">{quote.warning}</p>}
    </div>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className={strong ? "font-semibold" : ""}>{label}</p>
      <p className={strong ? "text-lg font-semibold" : "font-medium"}>{value}</p>
    </div>
  );
}
