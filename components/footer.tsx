"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useAccess } from "@/lib/use-access";

const discoveryColumns = [
  {
    title: "Villes",
    links: [
      ["Dakar", "/explorer?q=Dakar"],
      ["Saly", "/explorer?q=Saly"],
      ["Saint-Louis", "/explorer?q=Saint-Louis"],
      ["Somone", "/explorer?q=Somone"],
      ["Mbour", "/explorer?q=Mbour"],
      ["Cap Skirring", "/explorer?q=Cap%20Skirring"],
    ],
  },
  {
    title: "Professionnels",
    links: [
      ["Trouver un expert", "/services"],
      ["Nettoyage & conciergerie", "/services?categorie=entretien"],
      ["Artisans & dépannage", "/services?categorie=artisan"],
      ["Juridique & topographie", "/services?categorie=juridique"],
      ["Rejoindre l’annuaire", "/services?rejoindre=1"],
    ],
  },
];

export function Footer() {
  const { user } = useAuth();
  const { persona, can } = useAccess();
  const accountLinks = persona === "admin"
    ? [
        ["Administration", "/admin"],
        ["Pilotage", "/gestion"],
        ["Modération des biens", "/admin"],
        ["Messages", "/messages"],
        ["Mon compte", "/compte"],
      ]
    : persona === "agency" || persona === "agency_member"
    ? [
        ["Pilotage de l’agence", "/gestion"],
        [can("manage_catalog") ? "Parc immobilier" : "Mes dossiers", can("manage_catalog") ? "/gestion/biens" : "/voyages"],
        [can("manage_team") ? "Équipe" : can("manage_reservations") ? "Réservations" : "Mes favoris", can("manage_team") ? "/gestion/equipe" : can("manage_reservations") ? "/gestion/reservations" : "/favoris"],
        ["Messages", "/messages"],
        ["Mon compte", "/compte"],
      ]
    : persona === "owner"
      ? [
          ["Mon espace propriétaire", "/gestion"],
          ["Mon bien", "/gestion/biens"],
          ["Demandes reçues", "/gestion/reservations"],
          ["Messages", "/messages"],
          ["Mon compte", "/compte"],
        ]
      : persona === "owner_pending" || persona === "agency_pending"
        ? [
            ["Activer la publication", "/compte#certification"],
            ["Explorer les biens", "/explorer"],
            ["Mes favoris", "/favoris"],
            ["Mes messages", "/messages"],
            ["Mon compte", "/compte"],
          ]
      : user
        ? [
            ["Explorer les biens", "/explorer"],
            ["Mes favoris", "/favoris"],
            ["Mes dossiers", "/voyages"],
            ["Mes messages", "/messages"],
            ["Mon compte", "/compte"],
          ]
        : [
            ["Explorer les biens", "/explorer"],
            ["Se connecter", "/connexion"],
            ["Publier mon bien", "/publier"],
            ["Centre de confiance", "/confiance"],
            ["Télécharger l’application", "/telecharger"],
          ];
  const columns = [
    { title: user ? "Votre espace" : "Se Loger au Sénégal", links: accountLinks },
    ...discoveryColumns,
  ];

  return (
    <footer className="mt-16 border-t border-[#ebebeb] bg-[#f7f7f7]">
      <div className="grid gap-10 px-6 py-12 md:grid-cols-3 md:px-10 xl:px-16">
        {columns.map((column) => (
          <div key={column.title}>
            <p className="font-semibold">{column.title}</p>
            <ul className="mt-4 space-y-3">
              {column.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-[#222] hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#ebebeb] px-6 py-6 text-sm text-[#6a6a6a] md:px-10 xl:px-16">
        <p>© 2026 Se Loger au Sénégal · L'immobilier, en direct.</p>
        <p>Séjourner. Louer. Gérer.</p>
      </div>
    </footer>
  );
}
