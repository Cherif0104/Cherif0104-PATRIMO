import { photo } from "./images";
import type { Currency } from "./types";

export type OfferKind = "experience" | "service";

export type Offer = {
  id: string;
  databaseId?: string;
  ownerUserId?: string;
  publicationStatus?: "draft" | "pending_review" | "published" | "suspended" | "archived";
  kind: OfferKind;
  title: string;
  city: string;
  country: string;
  neighborhood: string;
  price: number;
  currency: Currency;
  unit: string;
  rating: number;
  reviewsCount: number;
  duration: string;
  images: string[];
  description: string;
  includes: string[];
  host: string;
};

export const EXPERIENCES: Offer[] = [
  {
    id: "pirogue-ngor",
    kind: "experience",
    title: "Pirogue au coucher du soleil",
    city: "Dakar",
    country: "Sénégal",
    neighborhood: "Ngor",
    price: 25_000,
    currency: "XOF",
    unit: "par personne",
    rating: 4.97,
    reviewsCount: 186,
    duration: "2 heures · départ à 17 h",
    images: [
      photo("photo-1507525428034-b723cf961d3e"),
      photo("photo-1476673160081-cf065607f449"),
      photo("photo-1510414842594-a61c69b5ae57"),
      photo("photo-1544551763-77ef2d0cfc6c"),
    ],
    description:
      "Une sortie en pirogue depuis la plage de Ngor, avec un pêcheur du quartier. On longe l'île, on s'arrête si la mer est calme, et on revient quand le soleil touche l'eau.\n\nLe gilet est fourni. Le groupe reste petit : six personnes au maximum, pour que la sortie reste une balade et non une navette.",
    includes: ["Skipper du quartier", "Gilet", "Eau fraîche", "Groupe de 6 maximum"],
    host: "Ibrahima Sarr",
  },
  {
    id: "diner-ouakam",
    kind: "experience",
    title: "Dîner thieboudienne chez l'habitant",
    city: "Dakar",
    country: "Sénégal",
    neighborhood: "Ouakam",
    price: 18_000,
    currency: "XOF",
    unit: "par personne",
    rating: 4.94,
    reviewsCount: 142,
    duration: "3 heures · soir",
    images: [
      photo("photo-1504674900247-0877df9cc836"),
      photo("photo-1414235077428-338989a2e8c0"),
      photo("photo-1555939594-58d7cb561ad1"),
      photo("photo-1517248135467-4c7edcad34c4"),
    ],
    description:
      "Awa cuisine le thieb dans sa cour, explique le riz, le poisson et les légumes, puis on passe à table avec la famille. Le repas n'est pas un spectacle : on mange ce qui est au plat.\n\nLe dîner convient aux voyageurs qui logent à Dakar et veulent un repas vrai, sans menu touristique.",
    includes: ["Repas complet", "Boisson locale", "Échange en français", "4 à 8 convives"],
    host: "Awa Diop",
  },
  {
    id: "lagune-somone",
    kind: "experience",
    title: "Lagune de la Somone en pirogue",
    city: "Saly",
    country: "Sénégal",
    neighborhood: "Somone",
    price: 20_000,
    currency: "XOF",
    unit: "par personne",
    rating: 4.9,
    reviewsCount: 98,
    duration: "2 h 30 · matin",
    images: [
      photo("photo-1500530855697-b586d89ba3ee"),
      photo("photo-1469474968028-56623f02e42e"),
      photo("photo-1476514525535-07fb3b4ae5f1"),
      photo("photo-1441974231531-c6227db76b6e"),
    ],
    description:
      "On entre dans la lagune à marée haute, entre palétuviers et oiseaux. Le guide s'arrête aux passages calmes et raconte comment le village vit de la lagune.\n\nPrévoir une casquette. La sortie se fait tôt, avant la chaleur.",
    includes: ["Pirogue", "Guide local", "Arrêt baobab", "Retour à Saly"],
    host: "Mamadou Fall",
  },
  {
    id: "saint-louis-calech",
    kind: "experience",
    title: "Saint-Louis en calèche",
    city: "Saint-Louis",
    country: "Sénégal",
    neighborhood: "Île de Saint-Louis",
    price: 15_000,
    currency: "XOF",
    unit: "par personne",
    rating: 4.86,
    reviewsCount: 74,
    duration: "1 h 30",
    images: [
      photo("photo-1469854523086-cc02fe5d8800"),
      photo("photo-1488646953014-85cb44e25828"),
      photo("photo-1527631746610-bca00a040d60"),
      photo("photo-1476514525535-07fb3b4ae5f1"),
    ],
    description:
      "Une boucle lente sur l'île : le pont Faidherbe, les façades, le fleuve, puis le quartier des pêcheurs de Guet Ndar si le groupe le souhaite.\n\nLa calèche attend à l'hôtel ou au logement. Le rythme reste celui de la ville, pas d'un circuit minuté.",
    includes: ["Calèche privée", "Cocher du quartier", "Arrêts photo", "Jusqu'à 4 personnes"],
    host: "Ndar Balades",
  },
  {
    id: "marche-kermel",
    kind: "experience",
    title: "Marché et atelier textile",
    city: "Dakar",
    country: "Sénégal",
    neighborhood: "Plateau",
    price: 22_000,
    currency: "XOF",
    unit: "par personne",
    rating: 4.88,
    reviewsCount: 63,
    duration: "3 heures · matin",
    images: [
      photo("photo-1488459716781-31db52582fe9"),
      photo("photo-1468413253725-0d5181091126"),
      photo("photo-1441986300917-64674bd600d8"),
      photo("photo-1523381210434-271e8be1f52b"),
    ],
    description:
      "On traverse le marché Kermel avec une styliste, on choisit un tissu, puis on passe à l'atelier pour voir une coupe. Rien n'est obligatoire à l'achat.\n\nUtile pour comprendre les prix avant de marchander seul.",
    includes: ["Guide styliste", "Visite du marché", "Passage atelier", "Jus de bissap"],
    host: "Atelier Ndargal",
  },
  {
    id: "sabar-almadies",
    kind: "experience",
    title: "Initiation au sabar",
    city: "Dakar",
    country: "Sénégal",
    neighborhood: "Almadies",
    price: 12_000,
    currency: "XOF",
    unit: "par personne",
    rating: 4.92,
    reviewsCount: 121,
    duration: "1 h 15",
    images: [
      photo("photo-1514525253161-7a46d19cd819"),
      photo("photo-1429962714451-bb934ecdc4ec"),
      photo("photo-1504609773096-104ff2c73ba4"),
      photo("photo-1493225457124-a3eb161ffa5f"),
    ],
    description:
      "Un cours court avec des percussionnistes : le rythme de base, puis quelques pas. On reste debout, en cercle, et personne n'est mis en spectacle.\n\nTenue souple. L'atelier a lieu en fin d'après-midi, dehors ou sous la véranda selon le vent.",
    includes: ["Tambour prêté", "Musicien", "Pas de base", "Groupe de 10"],
    host: "Compagnie Sunu",
  },
];

export const SERVICES: Offer[] = [
  {
    id: "menage-fin-sejour",
    kind: "service",
    title: "Ménage de fin de séjour",
    city: "Dakar",
    country: "Sénégal",
    neighborhood: "Toute la région",
    price: 15_000,
    currency: "XOF",
    unit: "par passage",
    rating: 4.91,
    reviewsCount: 210,
    duration: "2 à 4 heures",
    images: [
      photo("photo-1581578731548-c64695cc6952"),
      photo("photo-1527515637462-cff94eecc1ac"),
      photo("photo-1584622650111-993a426fbf0a"),
    ],
    description:
      "Une équipe passe après le départ des voyageurs : sols, sanitaires, cuisine, lits défaits. Le propriétaire reçoit une photo de chaque pièce.\n\nLe créneau se cale sur l'heure de check-out du logement.",
    includes: ["Produits inclus", "Photos de contrôle", "Cuisine et sanitaires", "Créneau le jour du départ"],
    host: "Se Loger au Sénégal Services",
  },
  {
    id: "accueil-cles",
    kind: "service",
    title: "Accueil et remise des clés",
    city: "Dakar",
    country: "Sénégal",
    neighborhood: "Dakar et Petite Côte",
    price: 10_000,
    currency: "XOF",
    unit: "par arrivée",
    rating: 4.95,
    reviewsCount: 164,
    duration: "30 minutes",
    images: [
      photo("photo-1560448204-e02f11c3d0e2"),
      photo("photo-1600210492486-724fe5c67fb0"),
      photo("photo-1600585154340-be6161a56a0c"),
    ],
    description:
      "Quelqu'un attend le voyageur, ouvre, montre l'eau, l'électricité, le wifi et les clés. Utile quand le propriétaire n'est pas sur place.\n\nL'arrivée se confirme la veille. En cas de retard de vol, l'accueil décale d'une heure sans frais.",
    includes: ["Présence à l'arrivée", "Explication du logement", "Photo des compteurs", "Numéro d'astreinte"],
    host: "Se Loger au Sénégal Services",
  },
  {
    id: "chef-domicile",
    kind: "service",
    title: "Chef à domicile",
    city: "Dakar",
    country: "Sénégal",
    neighborhood: "Almadies, Ngor, Plateau",
    price: 45_000,
    currency: "XOF",
    unit: "pour 4 personnes",
    rating: 4.89,
    reviewsCount: 57,
    duration: "Le soir, 3 heures",
    images: [
      photo("photo-1556910103-1c02745aae4d"),
      photo("photo-1551218808-94e220e084d2"),
      photo("photo-1504674900247-0877df9cc836"),
    ],
    description:
      "Un cuisinier fait les courses, prépare et sert dans le logement, puis laisse la cuisine rangée. Le menu se choisit la veille : poisson grillé, yassa ou un repas plus simple.\n\nLes courses sont en plus, sur ticket.",
    includes: ["Courses sur ticket", "Préparation", "Service", "Cuisine rangée"],
    host: "Table Se Loger au Sénégal",
  },
  {
    id: "photo-bien",
    kind: "service",
    title: "Shooting du logement",
    city: "Dakar",
    country: "Sénégal",
    neighborhood: "Sénégal",
    price: 75_000,
    currency: "XOF",
    unit: "par bien",
    rating: 4.93,
    reviewsCount: 41,
    duration: "Demi-journée",
    images: [
      photo("photo-1452587925148-ce544e77e70d"),
      photo("photo-1492691527719-9d1e07e534b4"),
      photo("photo-1600585154340-be6161a56a0c"),
    ],
    description:
      "Un photographe prépare les pièces, shoot en lumière du jour et livre une série prête à publier : façade, pièces, détails, vue.\n\nLes fichiers arrivent sous 48 heures. Ils remplacent les photos du téléphone sur la fiche.",
    includes: ["20 photos retouchées", "Lumière du jour", "Livraison 48 h", "Usage sur Se Loger au Sénégal"],
    host: "Studio Cayar",
  },
  {
    id: "linge-literie",
    kind: "service",
    title: "Linge et literie",
    city: "Dakar",
    country: "Sénégal",
    neighborhood: "Dakar",
    price: 8_000,
    currency: "XOF",
    unit: "par rotation",
    rating: 4.84,
    reviewsCount: 133,
    duration: "Le jour du changement",
    images: [
      photo("photo-1545173168-9f1947eebb7f"),
      photo("photo-1522771739844-6a9f6d5f14af"),
      photo("photo-1505693416388-ac5ce068fe85"),
    ],
    description:
      "Draps, serviettes et torchons propres, déposés et installés. L'ancien linge repart dans le même passage.\n\nLe forfait couvre un logement jusqu'à trois chambres. Au-delà, le prix se voit avant confirmation.",
    includes: ["Draps", "Serviettes", "Pose sur les lits", "Reprise du sale"],
    host: "Maison Lin",
  },
  {
    id: "chauffeur-aeroport",
    kind: "service",
    title: "Chauffeur aéroport",
    city: "Dakar",
    country: "Sénégal",
    neighborhood: "AIBD ↔ Dakar",
    price: 35_000,
    currency: "XOF",
    unit: "par trajet",
    rating: 4.87,
    reviewsCount: 208,
    duration: "Environ 1 heure",
    images: [
      photo("photo-1449965408869-eaa3f722e40d"),
      photo("photo-1469854523086-cc02fe5d8800"),
      photo("photo-1436491865332-7a61a109cc05"),
    ],
    description:
      "Prise en charge à l'aéroport Blaise Diagne ou départ du logement vers le vol. Le chauffeur suit le numéro de vol et attend en cas de retard court.\n\nBerline climatisée, quatre passagers et bagages de cabine plus deux valises.",
    includes: ["Suivi du vol", "Attente 45 min", "Eau", "Trajet direct"],
    host: "Se Loger au Sénégal Rides",
  },
  {
    id: "taxi-aibd-saly",
    kind: "service",
    title: "Taxi AIBD vers Saly et la Petite Côte",
    city: "Saly",
    country: "Sénégal",
    neighborhood: "AIBD ↔ Saly, Somone, Ngaparou",
    price: 30_000,
    currency: "XOF",
    unit: "par trajet",
    rating: 4.9,
    reviewsCount: 96,
    duration: "45 à 70 minutes",
    images: [
      photo("photo-1515569067071-ec3b51335dd0"),
      photo("photo-1549317661-bd32c8ce0db2"),
      photo("photo-1493238792000-8113da705763"),
    ],
    description:
      "Un taxi identifié vous attend à la sortie de l'aéroport avec votre nom. Destination Saly, Somone, Ngaparou ou une autre adresse de la Petite Côte.\n\nLe prix est fixé avant le départ et inclut les bagages standards.",
    includes: ["Accueil nominatif", "Prix fixé", "Suivi du vol", "Bagages inclus"],
    host: "Collectif Taxis AIBD",
  },
  {
    id: "van-aeroport",
    kind: "service",
    title: "Van aéroport pour groupes",
    city: "Dakar",
    country: "Sénégal",
    neighborhood: "AIBD ↔ Sénégal",
    price: 55_000,
    currency: "XOF",
    unit: "par trajet",
    rating: 4.92,
    reviewsCount: 71,
    duration: "Jusqu'à 8 voyageurs",
    images: [
      photo("photo-1544620347-c4fd4a3d5957"),
      photo("photo-1464219789935-c2d9d9aba644"),
      photo("photo-1515569067071-ec3b51335dd0"),
    ],
    description:
      "Un van climatisé pour les familles, groupes et voyageurs avec beaucoup de bagages. Le chauffeur ajuste l'heure d'arrivée grâce au numéro de vol.\n\nSièges enfant disponibles sur demande.",
    includes: ["Jusqu'à 8 places", "Climatisation", "Suivi du vol", "Siège enfant sur demande"],
    host: "Se Loger au Sénégal Rides",
  },
  {
    id: "location-voiture",
    kind: "service",
    title: "Location de voiture livrée au logement",
    city: "Dakar",
    country: "Sénégal",
    neighborhood: "Dakar, AIBD et Petite Côte",
    price: 28_000,
    currency: "XOF",
    unit: "par jour",
    rating: 4.82,
    reviewsCount: 118,
    duration: "À partir d'une journée",
    images: [
      photo("photo-1493238792000-8113da705763"),
      photo("photo-1549317661-bd32c8ce0db2"),
      photo("photo-1503376780353-7e6692767b70"),
    ],
    description:
      "Citadine, berline ou SUV livré à l'aéroport ou directement au logement. Le tarif, la caution et l'assurance sont affichés avant confirmation.\n\nPermis valide et pièce d'identité requis.",
    includes: ["Livraison", "Assurance de base", "Kilométrage affiché", "Assistance locale"],
    host: "Teranga Auto",
  },
];

export function experienceById(id: string) {
  return EXPERIENCES.find((item) => item.id === id);
}

export function serviceById(id: string) {
  return SERVICES.find((item) => item.id === id);
}
