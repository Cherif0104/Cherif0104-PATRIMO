"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { InspectionForm } from "@/components/inspection-form";
import { PageHead } from "@/components/ui";
import { useTitle } from "@/lib/use-title";

function NewInspection() {
  const params = useSearchParams();
  useTitle("Nouvel état des lieux · Se Loger au Sénégal");
  return (
    <div>
      <PageHead
        title="Nouvel état des lieux"
        text="Décrivez chaque pièce, relevez les compteurs, puis faites signer. Le document horodaté sert de témoin."
      />
      <InspectionForm presetListing={params.get("bien") ?? undefined} />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <NewInspection />
    </Suspense>
  );
}
