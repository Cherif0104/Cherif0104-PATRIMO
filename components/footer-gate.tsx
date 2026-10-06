"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./footer";

export function FooterGate() {
  const pathname = usePathname();
  if (pathname.startsWith("/explorer") || pathname.startsWith("/gestion") || pathname.startsWith("/admin")) {
    return null;
  }
  return <Footer />;
}
