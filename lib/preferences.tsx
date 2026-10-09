"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Language = "fr" | "wo" | "en" | "zh" | "ja" | "ko" | "es" | "it" | "pt" | "de";
export type ThemeMode = "light" | "dark" | "system";

export const LANGUAGES: Array<{ code: Language; label: string; native: string }> = [
  { code: "fr", label: "Français", native: "Français" },
  { code: "wo", label: "Wolof", native: "Wolof" },
  { code: "en", label: "Anglais", native: "English" },
  { code: "zh", label: "Chinois", native: "中文" },
  { code: "ja", label: "Japonais", native: "日本語" },
  { code: "ko", label: "Coréen", native: "한국어" },
  { code: "es", label: "Espagnol", native: "Español" },
  { code: "it", label: "Italien", native: "Italiano" },
  { code: "pt", label: "Portugais", native: "Português" },
  { code: "de", label: "Allemand", native: "Deutsch" },
];

const messages: Record<Language, Record<string, string>> = {
  fr: {
    explore: "Explorer", favorites: "Favoris", trips: "Voyages", messages: "Messages", profile: "Profil",
    all: "Tout voir", stays: "Logements", experiences: "Expériences", services: "Services",
    search: "Commencer ma recherche", destinations: "Destinations pour vous",
    popular: "Logements populaires", weekend: "Disponibles ce week-end",
    experienceWeekend: "Expériences ce week-end", stayServices: "Services pour votre séjour",
    mobility: "Taxi, transfert aéroport et location", verifiedDrivers: "chauffeurs vérifiés",
    arrivalTitle: "Votre arrivée au Sénégal, déjà organisée.",
    arrivalText: "Taxi AIBD, van familial, transfert vers la Petite Côte ou voiture de location. Prix annoncé avant le départ.",
    seeTransport: "Voir les transports", transportTitle: "Taxis, transferts et voitures",
    duringStay: "Services pendant votre séjour", publish: "Publier un bien", login: "Connexion",
    theme: "Apparence", language: "Langue", light: "Clair", dark: "Sombre", system: "Système",
  },
  wo: {
    explore: "Seet", favorites: "Yi ma bëgg", trips: "Tukki", messages: "Bataaxal", profile: "Profil",
    all: "Gis lépp", stays: "Dalukaay", experiences: "Xéewal", services: "Sarwiis",
    search: "Tambali seet", destinations: "Béréb yi ñu lay digal",
    popular: "Dalukaay yi ñuy bëgg", weekend: "Am na ci weekend bi",
    experienceWeekend: "Xéewal yi ci weekend bi", stayServices: "Sarwiis yi ngir sa tukki",
    mobility: "Taxi, transfert aéroport ak location", verifiedDrivers: "dawalkat yu wóor",
    arrivalTitle: "Sa ñëw ci Senegaal, lépp jekk na.",
    arrivalText: "Taxi AIBD, van, transfert Petite Côte walla oto bu ñu lay lebal.",
    seeTransport: "Gis transport yi", transportTitle: "Taxi, transfert ak oto",
    duringStay: "Sarwiis yi ci sa séjour", publish: "Yebal kër", login: "Dugg",
    theme: "Melo", language: "Làkk", light: "Leer", dark: "Lëndëm", system: "Sistem",
  },
  en: {
    explore: "Explore", favorites: "Wishlists", trips: "Trips", messages: "Messages", profile: "Profile",
    all: "All", stays: "Stays", experiences: "Experiences", services: "Services",
    search: "Start your search", destinations: "Destinations for you",
    popular: "Popular homes", weekend: "Available this weekend",
    experienceWeekend: "Experiences this weekend", stayServices: "Services for your stay",
    mobility: "Airport taxi, transfer and rental", verifiedDrivers: "verified drivers",
    arrivalTitle: "Your arrival in Senegal, already arranged.",
    arrivalText: "AIBD taxi, family van, Petite Côte transfer or rental car. Price confirmed before departure.",
    seeTransport: "See transport", transportTitle: "Taxis, transfers and cars",
    duringStay: "Services during your stay", publish: "List your property", login: "Log in",
    theme: "Appearance", language: "Language", light: "Light", dark: "Dark", system: "System",
  },
  zh: {
    explore: "探索", favorites: "收藏", trips: "旅程", messages: "消息", profile: "个人资料",
    all: "全部", stays: "住宿", experiences: "体验", services: "服务", search: "开始搜索",
    destinations: "为您推荐的目的地", popular: "热门住宿", weekend: "本周末可订",
    experienceWeekend: "本周末体验", stayServices: "旅程服务", mobility: "机场出租车、接送和租车",
    verifiedDrivers: "认证司机", arrivalTitle: "抵达塞内加尔，一切已安排。",
    arrivalText: "AIBD出租车、家庭面包车、小海岸接送或租车，出发前确认价格。",
    seeTransport: "查看交通", transportTitle: "出租车、接送与租车", duringStay: "住宿期间服务",
    publish: "发布房源", login: "登录", theme: "外观", language: "语言", light: "浅色", dark: "深色", system: "系统",
  },
  ja: {
    explore: "探す", favorites: "お気に入り", trips: "旅行", messages: "メッセージ", profile: "プロフィール",
    all: "すべて", stays: "宿泊先", experiences: "体験", services: "サービス", search: "検索を始める",
    destinations: "おすすめの目的地", popular: "人気の宿泊先", weekend: "今週末の空室",
    experienceWeekend: "今週末の体験", stayServices: "滞在サービス", mobility: "空港タクシー・送迎・レンタカー",
    verifiedDrivers: "認証済みドライバー", arrivalTitle: "セネガル到着の準備は整っています。",
    arrivalText: "AIBDタクシー、バン、プティット・コート送迎、レンタカー。料金は事前確定。",
    seeTransport: "交通を見る", transportTitle: "タクシー・送迎・車", duringStay: "滞在中のサービス",
    publish: "宿泊先を掲載", login: "ログイン", theme: "外観", language: "言語", light: "ライト", dark: "ダーク", system: "システム",
  },
  ko: {
    explore: "둘러보기", favorites: "위시리스트", trips: "여행", messages: "메시지", profile: "프로필",
    all: "전체", stays: "숙소", experiences: "체험", services: "서비스", search: "검색 시작하기",
    destinations: "추천 여행지", popular: "인기 숙소", weekend: "이번 주말 예약 가능",
    experienceWeekend: "이번 주말 체험", stayServices: "여행 서비스", mobility: "공항 택시·픽업·렌터카",
    verifiedDrivers: "인증 기사", arrivalTitle: "세네갈 도착 준비가 완료되었습니다.",
    arrivalText: "AIBD 택시, 가족용 밴, 쁘띠뜨 꼬뜨 픽업 또는 렌터카. 출발 전 가격 확정.",
    seeTransport: "교통편 보기", transportTitle: "택시·픽업·차량", duringStay: "숙박 중 서비스",
    publish: "숙소 등록", login: "로그인", theme: "화면", language: "언어", light: "라이트", dark: "다크", system: "시스템",
  },
  es: {
    explore: "Explorar", favorites: "Favoritos", trips: "Viajes", messages: "Mensajes", profile: "Perfil",
    all: "Ver todo", stays: "Alojamientos", experiences: "Experiencias", services: "Servicios", search: "Empieza tu búsqueda",
    destinations: "Destinos para ti", popular: "Alojamientos populares", weekend: "Disponible este fin de semana",
    experienceWeekend: "Experiencias este fin de semana", stayServices: "Servicios para tu estancia",
    mobility: "Taxi, traslado al aeropuerto y alquiler", verifiedDrivers: "conductores verificados",
    arrivalTitle: "Tu llegada a Senegal, ya organizada.", arrivalText: "Taxi AIBD, furgoneta familiar, traslado a Petite Côte o coche de alquiler.",
    seeTransport: "Ver transportes", transportTitle: "Taxis, traslados y coches", duringStay: "Servicios durante tu estancia",
    publish: "Publicar alojamiento", login: "Iniciar sesión", theme: "Apariencia", language: "Idioma", light: "Claro", dark: "Oscuro", system: "Sistema",
  },
  it: {
    explore: "Esplora", favorites: "Preferiti", trips: "Viaggi", messages: "Messaggi", profile: "Profilo",
    all: "Vedi tutto", stays: "Alloggi", experiences: "Esperienze", services: "Servizi", search: "Inizia la ricerca",
    destinations: "Destinazioni per te", popular: "Alloggi popolari", weekend: "Disponibili questo weekend",
    experienceWeekend: "Esperienze questo weekend", stayServices: "Servizi per il soggiorno",
    mobility: "Taxi, transfer aeroportuale e noleggio", verifiedDrivers: "autisti verificati",
    arrivalTitle: "Il tuo arrivo in Senegal è già organizzato.", arrivalText: "Taxi AIBD, van, transfer Petite Côte o auto a noleggio.",
    seeTransport: "Vedi trasporti", transportTitle: "Taxi, transfer e auto", duringStay: "Servizi durante il soggiorno",
    publish: "Pubblica un alloggio", login: "Accedi", theme: "Aspetto", language: "Lingua", light: "Chiaro", dark: "Scuro", system: "Sistema",
  },
  pt: {
    explore: "Explorar", favorites: "Favoritos", trips: "Viagens", messages: "Mensagens", profile: "Perfil",
    all: "Ver tudo", stays: "Acomodações", experiences: "Experiências", services: "Serviços", search: "Comece sua busca",
    destinations: "Destinos para você", popular: "Acomodações populares", weekend: "Disponíveis neste fim de semana",
    experienceWeekend: "Experiências neste fim de semana", stayServices: "Serviços para sua estadia",
    mobility: "Táxi, transfer do aeroporto e aluguel", verifiedDrivers: "motoristas verificados",
    arrivalTitle: "Sua chegada ao Senegal já está organizada.", arrivalText: "Táxi AIBD, van, transfer Petite Côte ou carro alugado.",
    seeTransport: "Ver transportes", transportTitle: "Táxis, transfers e carros", duringStay: "Serviços durante a estadia",
    publish: "Anunciar imóvel", login: "Entrar", theme: "Aparência", language: "Idioma", light: "Claro", dark: "Escuro", system: "Sistema",
  },
  de: {
    explore: "Entdecken", favorites: "Favoriten", trips: "Reisen", messages: "Nachrichten", profile: "Profil",
    all: "Alle", stays: "Unterkünfte", experiences: "Erlebnisse", services: "Services", search: "Suche starten",
    destinations: "Reiseziele für Sie", popular: "Beliebte Unterkünfte", weekend: "Dieses Wochenende verfügbar",
    experienceWeekend: "Erlebnisse am Wochenende", stayServices: "Services für Ihren Aufenthalt",
    mobility: "Flughafentaxi, Transfer und Mietwagen", verifiedDrivers: "geprüfte Fahrer",
    arrivalTitle: "Ihre Ankunft im Senegal ist bereits organisiert.", arrivalText: "AIBD-Taxi, Familienvan, Petite-Côte-Transfer oder Mietwagen.",
    seeTransport: "Transport ansehen", transportTitle: "Taxis, Transfers und Autos", duringStay: "Services während des Aufenthalts",
    publish: "Unterkunft inserieren", login: "Anmelden", theme: "Darstellung", language: "Sprache", light: "Hell", dark: "Dunkel", system: "System",
  },
};

type PreferencesContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  t: (key: string) => string;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function applyTheme(theme: ThemeMode) {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("fr");
  const [theme, setThemeState] = useState<ThemeMode>("system");

  useEffect(() => {
    const savedLanguage = localStorage.getItem("ameena-language") as Language | null;
    const savedTheme = localStorage.getItem("ameena-theme") as ThemeMode | null;
    if (savedLanguage && LANGUAGES.some((item) => item.code === savedLanguage)) setLanguageState(savedLanguage);
    if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) setThemeState(savedTheme);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem("ameena-language", language);
  }, [language]);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("ameena-theme", theme);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => theme === "system" && applyTheme("system");
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [theme]);

  const value = useMemo<PreferencesContextValue>(() => ({
    language,
    setLanguage: setLanguageState,
    theme,
    setTheme: setThemeState,
    t: (key) => messages[language][key] ?? messages.fr[key] ?? key,
  }), [language, theme]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error("PreferencesProvider absent");
  return context;
}
