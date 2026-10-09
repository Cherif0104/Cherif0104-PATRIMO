"use client";

import { Globe2, Laptop, Moon, Sun } from "lucide-react";
import { cx } from "@/lib/format";
import { LANGUAGES, type ThemeMode, usePreferences } from "@/lib/preferences";

const themes: Array<{ value: ThemeMode; icon: typeof Sun; key: "light" | "dark" | "system" }> = [
  { value: "light", icon: Sun, key: "light" },
  { value: "dark", icon: Moon, key: "dark" },
  { value: "system", icon: Laptop, key: "system" },
];

export function CompactPreferences() {
  const { language, setLanguage, theme, setTheme } = usePreferences();
  const ThemeIcon = themes.find((item) => item.value === theme)?.icon ?? Laptop;
  const nextTheme: ThemeMode = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";

  return (
    <div className="flex items-center gap-1">
      <label className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-[#f2f2f2]" title="Langue">
        <Globe2 className="h-5 w-5" />
        <select
          aria-label="Langue"
          value={language}
          onChange={(event) => setLanguage(event.target.value as typeof language)}
          className="absolute inset-0 cursor-pointer opacity-0"
        >
          {LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.native}</option>)}
        </select>
      </label>
      <button
        aria-label="Changer l’apparence"
        title="Apparence"
        className="grid h-10 w-10 place-items-center rounded-full hover:bg-[#f2f2f2]"
        onClick={() => setTheme(nextTheme)}
      >
        <ThemeIcon className="h-5 w-5" />
      </button>
    </div>
  );
}

export function PreferencesPanel() {
  const { language, setLanguage, theme, setTheme, t } = usePreferences();
  return (
    <section className="app-card rounded-[24px] border border-[#e5e5e5] p-5 shadow-[0_6px_20px_rgba(0,0,0,.07)] theme-border">
      <label className="block text-sm font-semibold">
        <span className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-[#C7A05A]" />{t("language")}</span>
        <select
          value={language}
          onChange={(event) => setLanguage(event.target.value as typeof language)}
          className="mt-3 w-full rounded-xl border border-[#dddddd] bg-transparent px-3 py-3 theme-border"
        >
          {LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.native}</option>)}
        </select>
      </label>
      <div className="mt-5">
        <p className="text-sm font-semibold">{t("theme")}</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {themes.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.value}
                onClick={() => setTheme(item.value)}
                className={cx(
                  "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs theme-border",
                  theme === item.value ? "border-[#C7A05A] bg-[#f7f0e2] font-semibold text-[#151515]" : "border-[#dddddd]",
                )}
              >
                <Icon className="h-4 w-4" />{t(item.key)}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
