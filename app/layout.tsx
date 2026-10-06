import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { BottomNav } from "@/components/bottom-nav";
import { FooterGate } from "@/components/footer-gate";
import { Header } from "@/components/header";
import { Providers } from "@/lib/store";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const display = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: {
    default: "Ameena — Séjourner, louer, gérer",
    template: "%s · Ameena",
  },
  description:
    "Marketplace immobilière et outil de gestion. Séjours, locations longue durée, finances, incidents et états des lieux.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={display.variable}>
      <body className={`${sans.className} antialiased`}>
        <Providers>
          <Header />
          <main>{children}</main>
          <FooterGate />
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
