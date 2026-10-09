import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { BottomNav } from "@/components/bottom-nav";
import { FooterGate } from "@/components/footer-gate";
import { Header } from "@/components/header";
import { AuthProvider } from "@/lib/auth";
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
  manifest: "/manifest.webmanifest",
  applicationName: "Ameena",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ameena",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={display.variable}>
      <body className={`${sans.className} antialiased`}>
        <AuthProvider>
          <Providers>
            <Header />
            <main>{children}</main>
            <FooterGate />
            <BottomNav />
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
