"use client";

import Link from "next/link";
import { BadgeCheck, Circle, Clock3 } from "lucide-react";
import { useAccess } from "@/lib/use-access";
import type { VerificationRequest } from "@/lib/types";

type Step = {
  label: string;
  detail: string;
  done: boolean;
  href?: string;
};

export function ProfileJourney({
  hasActiveListing,
  hasBookings,
  profileComplete,
  verificationRequest,
  verificationDocuments,
}: {
  hasActiveListing: boolean;
  hasBookings: boolean;
  profileComplete: boolean;
  verificationRequest: VerificationRequest | null;
  verificationDocuments: number;
}) {
  const { persona } = useAccess();
  const verificationApproved = verificationRequest?.status === "approved";
  const title = persona === "owner_pending" || persona === "agency_pending"
    ? persona === "agency_pending" ? "Activer votre parcours agence" : "Activer votre parcours propriétaire"
    : persona === "owner"
      ? "Piloter votre bien de bout en bout"
      : persona === "agency" || persona === "agency_member"
        ? "Votre espace de travail"
        : persona === "admin"
          ? "Superviser la plateforme"
          : "Réussir votre recherche";

  const steps: Step[] = persona === "owner_pending" || persona === "agency_pending"
    ? [
        {
          label: persona === "agency_pending" ? "Profil agence demandé" : "Profil propriétaire demandé",
          detail: persona === "agency_pending" ? "Votre structure doit être contrôlée avant activation." : "Votre intention de publier est enregistrée.",
          done: true,
        },
        {
          label: "Demande de certification",
          detail: verificationRequest ? `Statut : ${verificationRequest.status}` : "Envoyez votre demande depuis Profil et sécurité.",
          done: Boolean(verificationRequest),
          href: "/compte#certification",
        },
        {
          label: "Pièces justificatives",
          detail: verificationDocuments ? `${verificationDocuments} document(s) transmis.` : "Ajoutez identité et justificatif du bien.",
          done: verificationDocuments > 0,
          href: "/compte#certification",
        },
        {
          label: "Validation et publication",
          detail: verificationApproved ? "Votre publication peut commencer." : "La publication s’ouvre après validation administrative.",
          done: verificationApproved,
          href: verificationApproved ? "/publier" : "/compte#certification",
        },
      ]
    : persona === "owner"
      ? [
          { label: "Identité vérifiée", detail: "Votre accès propriétaire est actif.", done: true },
          {
            label: hasActiveListing ? "Bien enregistré" : "Publier votre bien",
            detail: hasActiveListing ? "Modifiez sa disponibilité et suivez sa validation." : "Créez votre annonce avec au moins trois photos.",
            done: hasActiveListing,
            href: hasActiveListing ? "/gestion/biens" : "/publier",
          },
          { label: "Demandes et messages", detail: "Répondez aux candidats depuis un dossier unique.", done: false, href: "/gestion/reservations" },
          { label: "Contrat et suivi", detail: "Centralisez contrat, état des lieux, finances et incidents.", done: false, href: "/gestion" },
        ]
      : persona === "agency" || persona === "agency_member"
        ? [
            { label: "Accès agence actif", detail: "Vos permissions suivent les domaines attribués.", done: true },
            { label: "Parc immobilier", detail: "Publiez et maintenez les biens autorisés.", done: false, href: "/gestion/biens" },
            { label: "Relation client", detail: "Qualifiez demandes, messages et opportunités.", done: false, href: "/gestion" },
          ]
        : persona === "admin"
          ? [
              { label: "Modération", detail: "Contrôlez profils, documents et annonces.", done: false, href: "/admin" },
              { label: "Exploitation", detail: "Suivez contrats, paiements et incidents.", done: false, href: "/gestion" },
            ]
          : [
              { label: "Compléter le profil", detail: "Ajoutez un téléphone pour faciliter le suivi.", done: profileComplete, href: "/compte#certification" },
              { label: "Explorer et enregistrer", detail: "Comparez les biens publiés et gardez vos favoris.", done: false, href: "/explorer" },
              { label: "Envoyer une demande", detail: "Dates, prix et commission sont figés dans votre dossier.", done: hasBookings, href: "/explorer" },
              { label: "Suivre le dossier", detail: "Retrouvez messages, contrat et paiement au même endroit.", done: hasBookings, href: "/voyages" },
            ];

  return (
    <section className="mt-6 rounded-[24px] border border-[#e5e5e5] bg-[#FFFDF7] p-5 md:p-6">
      <p className="text-xs font-semibold uppercase tracking-[.12em] text-[#C13515]">Parcours personnalisé</p>
      <h2 className="mt-2 text-xl font-semibold">{title}</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {steps.map((step) => {
          const content = (
            <>
              {step.done
                ? <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#16836f]" />
                : step.href
                  ? <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-[#C13515]" />
                  : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-[#8a8a8a]" />}
              <span>
                <span className="block text-sm font-semibold">{step.label}</span>
                <span className="mt-1 block text-xs leading-5 text-[#6a6a6a]">{step.detail}</span>
              </span>
            </>
          );
          return step.href
            ? <Link key={step.label} href={step.href} className="flex gap-3 rounded-2xl bg-white p-4 transition hover:shadow-sm">{content}</Link>
            : <div key={step.label} className="flex gap-3 rounded-2xl bg-white p-4">{content}</div>;
        })}
      </div>
    </section>
  );
}
