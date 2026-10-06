import { cx } from "@/lib/format";

export function PageHead({
  eyebrow,
  title,
  text,
  action,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="text-sm text-[#6a6a6a]">{eyebrow}</p>}
        <h1 className="text-[32px] font-semibold tracking-tight">{title}</h1>
        {text && <p className="mt-2 max-w-2xl text-[15px] leading-6 text-[#6a6a6a]">{text}</p>}
      </div>
      {action}
    </div>
  );
}

const tones = {
  neutral: "bg-[#f2f2f2] text-[#222]",
  good: "bg-[#e7f4f2] text-[#145e57]",
  warn: "bg-[#fff4e5] text-[#8a5a00]",
  bad: "bg-[#fff0ee] text-[#c13515]",
};

export function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
}) {
  return (
    <span className={cx("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", tones[tone])}>
      {children}
    </span>
  );
}

export function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#dddddd] px-6 py-14 text-center">
      <p className="text-lg font-semibold">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6a6a6a]">{text}</p>
    </div>
  );
}
