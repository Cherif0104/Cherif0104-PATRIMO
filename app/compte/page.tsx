"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BadgeCheck, CalendarDays, CreditCard, Home, LogOut, MessageCircle, Settings, ShieldCheck, Upload, UserRound } from "lucide-react";
import { InstallAppCard } from "@/components/install-app-card";
import { PreferencesPanel } from "@/components/preference-controls";
import { useAuth } from "@/lib/auth";
import { btnPrimary, btnSecondary, cx, fieldClass, formatDate, formatMoney, normalizePhoneE164 } from "@/lib/format";
import {
  loadHostPublicProfile,
  loadMyBookings,
  loadMyVerificationRequest,
  loadVerificationDocuments,
  saveHostPublicProfile,
  submitVerificationRequest,
  supabase,
  updateProfile,
  uploadVerificationDocument,
} from "@/lib/supabase";
import type { AccountType, MarketBooking, VerificationDocument, VerificationRequest } from "@/lib/types";
import { useTitle } from "@/lib/use-title";

const STATUS: Record<MarketBooking["status"], string> = {
  requested: "Demande envoyée",
  preapproved: "Préapprouvée",
  awaiting_payment: "Paiement attendu",
  confirmed: "Confirmée",
  declined: "Refusée",
  cancelled: "Annulée",
  completed: "Terminée",
  expired: "Délai de paiement expiré",
};

export default function AccountPage() {
  const { user, profile, loading, refreshProfile, signOut } = useAuth();
  const [bookings, setBookings] = useState<MarketBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("voyageur");
  const [businessName, setBusinessName] = useState("");
  const [bio, setBio] = useState("");
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [verificationRequest, setVerificationRequest] = useState<VerificationRequest | null>(null);
  const [verificationDocuments, setVerificationDocuments] = useState<VerificationDocument[]>([]);
  const [documentKind, setDocumentKind] = useState<VerificationDocument["document_kind"]>("identity");
  const [verificationBusy, setVerificationBusy] = useState(false);
  const [documentBusy, setDocumentBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [paymentBusy, setPaymentBusy] = useState("");
  const [view, setView] = useState<"activity" | "profile">("activity");
  useTitle("Mon compte · Se Loger au Sénégal");

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name);
    setPhone(profile.phone ?? "");
    setAccountType(
      profile.account_type === "voyageur"
        ? profile.requested_account_type
        : profile.account_type,
    );
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    setBookingsLoading(true);
    loadMyBookings()
      .then(setBookings)
      .catch(() => setError("Les demandes ne peuvent pas être chargées pour le moment."))
      .finally(() => setBookingsLoading(false));
  }, [user]);

  useEffect(() => {
    if (
      !user
      || !profile
      || (
        profile.account_type === "voyageur"
        && profile.requested_account_type === "voyageur"
      )
    ) return;
    Promise.all([
      loadHostPublicProfile(user.id),
      loadMyVerificationRequest(),
    ]).then(([hostProfile, request]) => {
      if (hostProfile) {
        setBusinessName(hostProfile.business_name ?? "");
        setBio(hostProfile.bio ?? "");
        setWhatsappEnabled(hostProfile.whatsapp_enabled);
        if (hostProfile.whatsapp_e164 && !phone) setPhone(hostProfile.whatsapp_e164);
      }
      setVerificationRequest(request);
      if (request) {
        void loadVerificationDocuments(request.id).then(setVerificationDocuments);
      }
    }).catch(() => setError("Le profil public n’a pas pu être chargé."));
  }, [profile, user]);

  if (loading) {
    return <div className="px-4 py-20 text-center text-sm text-[#6a6a6a]">Ouverture du compte…</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#fff1f3] text-[#C13515]">
            <UserRound />
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight">Votre espace Se Loger au Sénégal</h1>
          <p className="mt-3 text-[#6a6a6a]">Connectez-vous pour retrouver vos demandes, publier ou gérer un bien.</p>
          <Link href="/connexion?retour=/compte" className={`${btnPrimary} mt-7`}>Se connecter</Link>
        </div>
        <div className="mt-10 text-left"><PreferencesPanel /></div>
      </div>
    );
  }

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!profile) return;
    setSaved(false);
    setError("");
    try {
      await updateProfile({
        id: profile.id,
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        requested_account_type: accountType,
      });
      if (accountType !== "voyageur") {
        const whatsappE164 = normalizePhoneE164(phone);
        if (whatsappEnabled && !/^\+[1-9][0-9]{7,14}$/.test(whatsappE164)) {
          throw new Error("whatsapp_invalid");
        }
        await saveHostPublicProfile({
          ownerId: profile.id,
          displayName: fullName.trim(),
          businessName,
          bio,
          whatsappE164,
          whatsappEnabled,
        });
      }
      await refreshProfile();
      setSaved(true);
    } catch (cause) {
      setError(
        cause instanceof Error && cause.message === "whatsapp_invalid"
          ? "Le numéro WhatsApp doit être au format international, par exemple +221770000000."
          : "Le profil n’a pas pu être enregistré.",
      );
    }
  }

  async function requestVerification() {
    if (!user || !profile || accountType === "voyageur" || verificationRequest) return;
    setVerificationBusy(true);
    setError("");
    try {
      await updateProfile({
        id: profile.id,
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        requested_account_type: accountType,
      });
      const request = await submitVerificationRequest({
        userId: user.id,
        accountType,
        businessName,
        note: "Demande envoyée depuis le profil.",
      });
      setVerificationRequest(request);
    } catch {
      setError("La demande de certification n’a pas pu être envoyée.");
    } finally {
      setVerificationBusy(false);
    }
  }

  async function addVerificationDocument(file: File | undefined) {
    if (!file || !user || !verificationRequest) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("Le document doit peser moins de 10 Mo.");
      return;
    }
    setDocumentBusy(true);
    setError("");
    try {
      const document = await uploadVerificationDocument({
        userId: user.id,
        requestId: verificationRequest.id,
        kind: documentKind,
        file,
      });
      setVerificationDocuments((rows) => [...rows, document]);
    } catch {
      setError("Le document n’a pas pu être envoyé.");
    } finally {
      setDocumentBusy(false);
    }
  }

  async function startPayment(booking: MarketBooking) {
    if (!supabase || !user) return;
    setPaymentBusy(booking.id);
    setError("");
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Votre session a expiré. Reconnectez-vous.");
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `checkout:${booking.id}:${user.id}`,
        },
        body: JSON.stringify({
          bookingId: booking.id,
          paymentMethod: "hosted_checkout",
        }),
      });
      const result = await response.json() as { checkoutUrl?: string; message?: string };
      if (!response.ok || !result.checkoutUrl) {
        throw new Error(result.message || "Le paiement ne peut pas être ouvert.");
      }
      window.location.assign(result.checkoutUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Le paiement ne peut pas être ouvert.");
      setPaymentBusy("");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
      <div className="mb-7 lg:hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#6a6a6a]">Mon espace</p>
            <h1 className="text-[28px] font-semibold tracking-[-0.04em]">{profile?.full_name || user.email}</h1>
          </div>
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[#e7f4f2] text-xl font-semibold text-[#1F6F66]">
            {(profile?.full_name || user.email || "A").slice(0, 1).toUpperCase()}
          </span>
        </div>
      </div>

      <div className="hidden flex-wrap items-end justify-between gap-4 lg:flex">
        <div>
          <p className="text-sm font-medium text-[#1F6F66]">Compte sécurisé</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Bonjour {profile?.full_name || user.email}</h1>
          <p className="mt-2 text-sm text-[#6a6a6a]">{user.email}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/portefeuille" className={btnSecondary}>Mon portefeuille</Link>
          <button className={btnSecondary} onClick={() => void signOut()}>
            <LogOut className="h-4 w-4" /> Se déconnecter
          </button>
        </div>
      </div>

      <RoleActions accountType={profile?.account_type ?? "voyageur"} />

      <div className="mt-6 grid grid-cols-2 rounded-full bg-[#f2f2f2] p-1 text-sm">
        <button onClick={() => setView("activity")} className={cx("rounded-full px-4 py-2.5 font-medium", view === "activity" && "bg-white shadow-sm")}>Activité</button>
        <button onClick={() => setView("profile")} className={cx("rounded-full px-4 py-2.5 font-medium", view === "profile" && "bg-white shadow-sm")}>Profil et sécurité</button>
      </div>

      <div className="mt-7">
        {view === "activity" && <section>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Mes demandes</h2>
              <p className="mt-1 text-sm text-[#6a6a6a]">Les demandes envoyées depuis les fiches sont privées.</p>
            </div>
            <CalendarDays className="text-[#6a6a6a]" />
          </div>
          <div className="mt-5 grid gap-3">
            {bookingsLoading && <p className="rounded-2xl bg-[#f7f7f7] p-5 text-sm">Chargement…</p>}
            {!bookingsLoading && bookings.length === 0 && (
              <div className="rounded-[20px] border border-dashed border-[#cccccc] p-8 text-center">
                <Home className="mx-auto text-[#6a6a6a]" />
                <p className="mt-3 font-semibold">Aucune demande pour le moment</p>
                <p className="mt-1 text-sm text-[#6a6a6a]">Explorez un logement et envoyez une demande avec vos dates.</p>
                <Link href="/" className={`${btnSecondary} mt-5`}>Voir les logements</Link>
              </div>
            )}
            {bookings.map((booking) => (
              <article key={booking.id} className="rounded-[20px] border border-[#e5e5e5] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{booking.listing_title}</h3>
                    <p className="mt-1 text-sm text-[#6a6a6a]">
                      {formatDate(booking.start_date)} → {formatDate(booking.end_date)}
                    </p>
                  </div>
                  <span className={cx(
                    "rounded-full px-3 py-1 text-xs font-medium",
                    booking.status === "confirmed" || booking.status === "completed"
                      ? "bg-[#e7f4f2] text-[#145e57]"
                      : booking.status === "declined" || booking.status === "cancelled"
                        ? "bg-[#f2f2f2] text-[#6a6a6a]"
                        : "bg-[#fff4dd] text-[#7a4c00]",
                  )}>
                    {STATUS[booking.status]}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#eeeeee] pt-4 text-sm">
                  <span className="text-[#6a6a6a]">Total voyageur</span>
                  <strong>{formatMoney(booking.total, booking.currency)}</strong>
                  {(booking.status === "preapproved" || booking.status === "awaiting_payment") && (
                    <button
                      className={btnPrimary}
                      disabled={paymentBusy === booking.id}
                      onClick={() => void startPayment(booking)}
                    >
                      <CreditCard className="h-4 w-4" />
                      {paymentBusy === booking.id ? "Ouverture…" : "Payer de façon sécurisée"}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>}

        {view === "profile" && <aside className="mx-auto max-w-2xl rounded-[20px] border border-[#dddddd] p-6 shadow-[0_4px_16px_rgba(0,0,0,.06)]">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-[#1F6F66] font-semibold text-white">
              {(profile?.full_name || user.email || "A").slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold">Profil</p>
              <p className="flex items-center gap-1 text-xs text-[#6a6a6a]">
                {profile?.identity_status === "verifie" ? <BadgeCheck className="h-3.5 w-3.5 text-[#1F6F66]" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                {profile?.identity_status === "verifie" ? "Identité vérifiée" : "Identité à vérifier avant encaissement"}
              </p>
            </div>
          </div>
          <form className="mt-6 grid gap-4" onSubmit={saveProfile}>
            <label className="text-sm font-medium">
              Nom complet
              <input className={`${fieldClass} mt-1`} value={fullName} onChange={(event) => setFullName(event.target.value)} minLength={2} required />
            </label>
            {(accountType === "proprietaire" || accountType === "agence") && (
              <>
                <label className="text-sm font-medium">
                  Nom commercial <span className="font-normal text-[#6a6a6a]">· facultatif</span>
                  <input className={`${fieldClass} mt-1`} value={businessName} onChange={(event) => setBusinessName(event.target.value)} maxLength={120} placeholder="Agence Teranga Immobilier" />
                </label>
                <label className="text-sm font-medium">
                  Présentation publique
                  <textarea className={`${fieldClass} mt-1 min-h-24`} value={bio} onChange={(event) => setBio(event.target.value)} maxLength={600} placeholder="Présentez votre activité et votre expérience." />
                </label>
                <label className="flex items-start gap-3 rounded-2xl border border-[#dddddd] p-4 text-sm">
                  <input className="mt-1" type="checkbox" checked={whatsappEnabled} onChange={(event) => setWhatsappEnabled(event.target.checked)} />
                  <span>
                    <span className="flex items-center gap-2 font-semibold"><MessageCircle className="h-4 w-4 text-[#16836f]" /> Autoriser le contact WhatsApp</span>
                    <span className="mt-1 block text-xs leading-5 text-[#6a6a6a]">Votre numéro sera public sur vos annonces. Décochez cette option pour le masquer immédiatement.</span>
                  </span>
                </label>
              </>
            )}
            <label className="text-sm font-medium">
              Téléphone
              <input className={`${fieldClass} mt-1`} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+221 77 000 00 00" autoComplete="tel" />
            </label>
            <label className="text-sm font-medium">
              Utilisation principale
              <select className={`${fieldClass} mt-1`} value={accountType} onChange={(event) => setAccountType(event.target.value as AccountType)}>
                <option value="voyageur">Voyageur</option>
                <option value="proprietaire">Propriétaire</option>
                {(accountType === "agence" || profile?.account_type === "agence" || profile?.requested_account_type === "agence") && (
                  <option value="agence">Agence</option>
                )}
              </select>
            </label>
            {accountType !== "agence" && (
              <div className="rounded-2xl bg-[#FFF8ED] p-4 text-sm">
                <p className="font-semibold text-[#182A39]">Vous représentez une agence immobilière ?</p>
                <p className="mt-1 leading-5 text-[#6a6a6a]">Les comptes agences sont ouverts par le service commercial Impulcia Afrique après contrôle des documents professionnels.</p>
                <a href="https://wa.me/221788324069?text=Bonjour%2C%20je%20souhaite%20inscrire%20mon%20agence%20sur%20Se%20Loger%20au%20S%C3%A9n%C3%A9gal." target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex font-semibold text-[#16836f] underline">
                  WhatsApp : +221 78 832 40 69
                </a>
              </div>
            )}
            {saved && <p className="text-sm text-[#145e57]">Profil enregistré.</p>}
            {error && <p role="alert" className="text-sm text-[#a52a12]">{error}</p>}
            <button className={`${btnPrimary} w-full`}>Enregistrer</button>
          </form>
          {(accountType === "proprietaire" || accountType === "agence") && (
            <>
              {profile?.identity_status === "verifie" && (
                <Link href="/publier" className={`${btnSecondary} mt-3 w-full`}>Publier un bien</Link>
              )}
              {profile?.identity_status !== "verifie" && (
                <button
                  type="button"
                  className={`${btnSecondary} mt-3 w-full`}
                  disabled={verificationBusy || Boolean(verificationRequest)}
                  onClick={() => void requestVerification()}
                >
                  <BadgeCheck className="h-4 w-4" />
                  {verificationRequest
                    ? verificationRequest.status === "reviewing" ? "Certification en cours d’étude" : "Certification demandée"
                    : verificationBusy ? "Envoi…" : "Demander la certification"}
                </button>
              )}
              {verificationRequest && (
                <div className="mt-3 rounded-2xl border border-[#dddddd] p-4">
                  <p className="text-sm font-semibold">Documents de vérification</p>
                  <p className="mt-1 text-xs leading-5 text-[#6a6a6a]">Fichiers privés, accessibles uniquement à vous et à l’équipe de contrôle.</p>
                  <select className={`${fieldClass} mt-3`} value={documentKind} onChange={(event) => setDocumentKind(event.target.value as VerificationDocument["document_kind"])}>
                    <option value="identity">Pièce d’identité</option>
                    <option value="ownership">Justificatif du bien</option>
                    <option value="business_registration">Registre de l’entreprise</option>
                    <option value="other">Autre document</option>
                  </select>
                  <label className={`${btnSecondary} mt-3 w-full cursor-pointer`}>
                    <Upload className="h-4 w-4" />
                    {documentBusy ? "Envoi sécurisé…" : "Ajouter un document"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      className="sr-only"
                      disabled={documentBusy}
                      onChange={(event) => {
                        void addVerificationDocument(event.target.files?.[0]);
                        event.target.value = "";
                      }}
                    />
                  </label>
                  <p className="mt-2 text-xs text-[#6a6a6a]">{verificationDocuments.length} document{verificationDocuments.length > 1 ? "s" : ""} envoyé{verificationDocuments.length > 1 ? "s" : ""}</p>
                </div>
              )}
              <p className="mt-3 text-xs leading-5 text-[#6a6a6a]">La certification repose aujourd’hui sur une vérification documentaire. Aucun abonnement n’est facturé tant que l’offre Pro n’est pas définie.</p>
            </>
          )}
          <button className={`${btnSecondary} mt-5 w-full`} onClick={() => void signOut()}>
            <LogOut className="h-4 w-4" /> Se déconnecter
          </button>
        </aside>}
      </div>
      {view === "profile" && <div className="mx-auto mt-6 max-w-2xl">
        <div className="grid gap-4">
          <PreferencesPanel />
          <InstallAppCard />
        </div>
      </div>}
    </div>
  );
}

function RoleActions({ accountType }: { accountType: AccountType }) {
  const actions = accountType === "agence"
    ? [
        { href: "/gestion", label: "Piloter l’agence", icon: Home },
        { href: "/gestion/crm", label: "Ouvrir le CRM", icon: MessageCircle },
        { href: "/gestion/equipe", label: "Gérer l’équipe", icon: Settings },
      ]
    : accountType === "proprietaire"
      ? [
          { href: "/gestion", label: "Gérer mon bien", icon: Home },
          { href: "/publier", label: "Publier un bien", icon: Upload },
          { href: "/messages", label: "Voir les messages", icon: MessageCircle },
        ]
      : [
          { href: "/explorer", label: "Trouver un logement", icon: Home },
          { href: "/voyages", label: "Mes dossiers", icon: CalendarDays },
          { href: "/messages", label: "Mes messages", icon: MessageCircle },
        ];

  return (
    <nav className="mt-7 grid gap-2 sm:grid-cols-3" aria-label="Actions principales">
      {actions.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} className="flex items-center gap-3 rounded-2xl border border-[#e5e5e5] bg-white p-4 text-sm font-semibold hover:shadow-sm">
          <Icon className="h-5 w-5 text-[#C13515]" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
