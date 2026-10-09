import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { BottomNav } from "@/components/bottom-nav";
import { FooterGate } from "@/components/footer-gate";
import { Header } from "@/components/header";
import { AuthProvider } from "@/lib/auth";
import { PreferencesProvider } from "@/lib/preferences";
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://cherif0104-patrimo.vercel.app"),
  title: {
    default: "Se Loger au Sénégal — Séjourner, louer, gérer",
    template: "%s · Se Loger au Sénégal",
  },
  description:
    "Marketplace immobilière et outil de gestion. Séjours, locations longue durée, finances, incidents et états des lieux.",
  manifest: "/manifest.webmanifest",
  applicationName: "Se Loger au Sénégal",
  openGraph: {
    type: "website",
    locale: "fr_SN",
    siteName: "Se Loger au Sénégal",
  },
  twitter: { card: "summary_large_image" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Se Loger au Sénégal",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#101010" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={display.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const t=localStorage.getItem("ameena-theme")||"system";const d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme:dark)").matches);document.documentElement.dataset.theme=d?"dark":"light";document.documentElement.style.colorScheme=d?"dark":"light"}catch(e){}`,
          }}
        />
      </head>
      <body className={`${sans.className} antialiased`}>
        <PreferencesProvider>
          <AuthProvider>
            <Providers>
              <Header />
              <main>{children}</main>
              <FooterGate />
              <BottomNav />
            </Providers>
          </AuthProvider>
        </PreferencesProvider>
      </body>
    </html>
  );
}
