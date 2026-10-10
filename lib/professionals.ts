import { photo } from "./images";
import type { PartnerCategory } from "./types";

export type ProfessionalReview = {
  id: string;
  name: string;
  rating: number;
  text: string;
};

export type Professional = {
  id: string;
  databaseId?: string;
  businessName: string;
  category: PartnerCategory;
  categoryLabel: string;
  city: string;
  address: string;
  serviceRadiusKm: number;
  description: string;
  image: string;
  verified: boolean;
  demonstration?: boolean;
  whatsapp: string;
  services: string[];
  portfolio: string[];
  reviews: ProfessionalReview[];
};

export const PROFESSIONAL_CATEGORIES: Array<{ value: PartnerCategory | "tous"; label: string }> = [
  { value: "tous", label: "Tous les services" },
  { value: "artisan", label: "Artisans & dépannage" },
  { value: "entretien", label: "Nettoyage & entretien" },
  { value: "juridique", label: "Foncier & juridique" },
  { value: "securite", label: "Sécurité" },
  { value: "demenagement", label: "Déménagement" },
  { value: "ameublement", label: "Aménagement" },
  { value: "assurance", label: "Assurance" },
  { value: "autre", label: "Conciergerie" },
];

export const DEMO_PROFESSIONALS: Professional[] = [
  {
    id: "topographie-sunu-plan",
    businessName: "Sunu Plan Topographie",
    category: "juridique",
    categoryLabel: "Géomètre & topographie",
    city: "Dakar",
    address: "Dakar et régions",
    serviceRadiusKm: 120,
    description: "Bornage, levé topographique, implantation de chantier et préparation des pièces techniques d’un dossier foncier.",
    image: photo("photo-1504307651254-35680f356dfd"),
    verified: true,
    demonstration: true,
    whatsapp: "+221788324069",
    services: ["Levé topographique", "Bornage contradictoire", "Implantation", "Plan de situation"],
    portfolio: [photo("photo-1503387762-592deb58ef4e"), photo("photo-1504307651254-35680f356dfd")],
    reviews: [{ id: "topo-1", name: "M. Diop", rating: 5, text: "Exemple d’avis : livrables expliqués et délais clairement annoncés." }],
  },
  {
    id: "atelier-teranga-batiment",
    businessName: "Atelier Teranga Bâtiment",
    category: "artisan",
    categoryLabel: "Construction & rénovation",
    city: "Dakar",
    address: "Dakar, Rufisque et Thiès",
    serviceRadiusKm: 80,
    description: "Rénovation intérieure, maçonnerie, peinture et coordination de petits chantiers résidentiels.",
    image: photo("photo-1503387762-592deb58ef4e"),
    verified: true,
    demonstration: true,
    whatsapp: "+221788324069",
    services: ["Rénovation", "Maçonnerie", "Peinture", "Suivi de chantier"],
    portfolio: [photo("photo-1503387762-592deb58ef4e"), photo("photo-1504307651254-35680f356dfd")],
    reviews: [{ id: "bat-1", name: "Awa S.", rating: 5, text: "Exemple d’avis : devis détaillé et réception organisée pièce par pièce." }],
  },
  {
    id: "senegal-plomberie-express",
    businessName: "Sénégal Plomberie Express",
    category: "artisan",
    categoryLabel: "Plomberie & urgence",
    city: "Dakar",
    address: "Dakar",
    serviceRadiusKm: 35,
    description: "Recherche de fuite, débouchage, chauffe-eau, robinetterie et dépannage rapide des logements occupés.",
    image: photo("photo-1585704032915-c3400ca199e7"),
    verified: true,
    demonstration: true,
    whatsapp: "+221788324069",
    services: ["Recherche de fuite", "Débouchage", "Chauffe-eau", "Dépannage urgent"],
    portfolio: [photo("photo-1585704032915-c3400ca199e7")],
    reviews: [{ id: "plomb-1", name: "Ndeye F.", rating: 5, text: "Exemple d’avis : diagnostic transmis avec photos avant réparation." }],
  },
  {
    id: "jappo-electricite",
    businessName: "Jappo Électricité",
    category: "artisan",
    categoryLabel: "Électricité & solaire",
    city: "Dakar",
    address: "Dakar et Petite Côte",
    serviceRadiusKm: 90,
    description: "Mise aux normes, tableaux électriques, dépannage, éclairage et solutions solaires pour maisons et immeubles.",
    image: photo("photo-1621905251189-08b45d6a269e"),
    verified: true,
    demonstration: true,
    whatsapp: "+221788324069",
    services: ["Diagnostic électrique", "Tableau", "Éclairage", "Installation solaire"],
    portfolio: [photo("photo-1621905251189-08b45d6a269e")],
    reviews: [{ id: "elec-1", name: "Ibrahima K.", rating: 5, text: "Exemple d’avis : installation testée et consignes de sécurité remises." }],
  },
  {
    id: "keur-propre",
    businessName: "Keur Propre",
    category: "entretien",
    categoryLabel: "Nettoyage à domicile",
    city: "Dakar",
    address: "Dakar et banlieue",
    serviceRadiusKm: 45,
    description: "Nettoyage ponctuel ou régulier, remise en état après chantier et préparation entre deux locations.",
    image: photo("photo-1581578731548-c64695cc6952"),
    verified: true,
    demonstration: true,
    whatsapp: "+221788324069",
    services: ["Ménage régulier", "Fin de séjour", "Après chantier", "Nettoyage profond"],
    portfolio: [photo("photo-1581578731548-c64695cc6952"), photo("photo-1527515637462-cff94eecc1ac")],
    reviews: [{ id: "clean-1", name: "Sophie B.", rating: 5, text: "Exemple d’avis : contrôle final documenté avant la remise des clés." }],
  },
  {
    id: "ndar-conciergerie",
    businessName: "Ndar Conciergerie",
    category: "autre",
    categoryLabel: "Conciergerie locative",
    city: "Saint-Louis",
    address: "Saint-Louis",
    serviceRadiusKm: 30,
    description: "Accueil voyageurs, remise de clés, états des lieux, coordination du linge et suivi des petites interventions.",
    image: photo("photo-1560448204-e02f11c3d0e2"),
    verified: true,
    demonstration: true,
    whatsapp: "+221788324069",
    services: ["Accueil", "Remise de clés", "État des lieux", "Coordination maintenance"],
    portfolio: [photo("photo-1560448204-e02f11c3d0e2")],
    reviews: [{ id: "conc-1", name: "Moussa N.", rating: 5, text: "Exemple d’avis : arrivée tardive gérée et compte rendu envoyé le soir même." }],
  },
  {
    id: "serrurerie-dakar-24",
    businessName: "Serrurerie Dakar 24",
    category: "securite",
    categoryLabel: "Serrurerie & accès",
    city: "Dakar",
    address: "Dakar",
    serviceRadiusKm: 40,
    description: "Ouverture de porte, remplacement de serrure, sécurisation d’accès et gestion de doubles de clés.",
    image: photo("photo-1558618666-fcd25c85cd64"),
    verified: true,
    demonstration: true,
    whatsapp: "+221788324069",
    services: ["Ouverture de porte", "Serrure", "Blindage", "Double de clés"],
    portfolio: [photo("photo-1558618666-fcd25c85cd64")],
    reviews: [{ id: "lock-1", name: "Fatou C.", rating: 5, text: "Exemple d’avis : identité contrôlée avant l’ouverture et tarif confirmé." }],
  },
  {
    id: "set-setal-collecte",
    businessName: "Set Setal Collecte",
    category: "entretien",
    categoryLabel: "Collecte & débarras",
    city: "Dakar",
    address: "Dakar et Rufisque",
    serviceRadiusKm: 55,
    description: "Débarras de logement, évacuation d’encombrants et collecte programmée pour résidences et locations.",
    image: photo("photo-1532996122724-e3c354a0b15b"),
    verified: true,
    demonstration: true,
    whatsapp: "+221788324069",
    services: ["Débarras", "Encombrants", "Collecte programmée", "Nettoyage de cour"],
    portfolio: [photo("photo-1532996122724-e3c354a0b15b")],
    reviews: [{ id: "waste-1", name: "Cheikh T.", rating: 5, text: "Exemple d’avis : passage confirmé et espace laissé propre." }],
  },
];

export function professionalCategoryLabel(category: PartnerCategory) {
  return PROFESSIONAL_CATEGORIES.find((item) => item.value === category)?.label ?? "Service immobilier";
}
