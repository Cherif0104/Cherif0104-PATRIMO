"use client";

import { GestionShell } from "@/components/gestion-shell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <GestionShell>{children}</GestionShell>;
}
