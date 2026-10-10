"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHead, Pill } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { btnPrimary, btnSecondary, fieldClass } from "@/lib/format";
import {
  createOrganization,
  createOrganizationInvitation,
  loadOrganizationInvitations,
  loadOrganizationMembers,
  loadOrganizations,
} from "@/lib/supabase";
import type { FunctionalDomain, Organization, OrganizationInvitation, OrganizationMember } from "@/lib/types";
import { useTitle } from "@/lib/use-title";

const domains: Array<{ value: FunctionalDomain; label: string }> = [
  { value: "catalogue", label: "Catalogue" },
  { value: "crm", label: "CRM" },
  { value: "reservations", label: "Réservations" },
  { value: "contracts", label: "Contrats" },
  { value: "finance", label: "Finances" },
  { value: "maintenance", label: "Maintenance" },
  { value: "administration", label: "Administration" },
];

export default function TeamPage() {
  const { user, profile } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrganizationInvitation["role"]>("agent");
  const [functionalDomains, setFunctionalDomains] = useState<FunctionalDomain[]>(["catalogue", "crm"]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useTitle("Équipe · Se Loger au Sénégal");
  const canCreateOrganization = user?.app_metadata?.role === "admin" || profile?.account_type === "agence";

  useEffect(() => {
    loadOrganizations()
      .then((rows) => {
        setOrganizations(rows);
        setSelectedId(rows[0]?.id ?? "");
      })
      .catch(() => setMessage("Les organisations ne peuvent pas être chargées."));
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMembers([]);
      setInvitations([]);
      return;
    }
    Promise.all([
      loadOrganizationMembers(selectedId),
      loadOrganizationInvitations(selectedId),
    ]).then(([memberRows, invitationRows]) => {
      setMembers(memberRows);
      setInvitations(invitationRows);
    }).catch(() => setMessage("Les membres ne peuvent pas être chargés."));
  }, [selectedId]);

  async function addOrganization(event: React.FormEvent) {
    event.preventDefault();
    if (!user || name.trim().length < 2) return;
    setBusy(true);
    try {
      const organization = await createOrganization(user.id, name);
      setOrganizations((rows) => [...rows, organization]);
      setSelectedId(organization.id);
      setName("");
    } catch {
      setMessage("L’organisation n’a pas pu être créée.");
    } finally {
      setBusy(false);
    }
  }

  async function invite(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !selectedId || !email.includes("@")) return;
    setBusy(true);
    try {
      const invitation = await createOrganizationInvitation({
        organizationId: selectedId,
        userId: user.id,
        email,
        role,
        functionalDomains,
      });
      setInvitations((rows) => [invitation, ...rows]);
      setEmail("");
      setMessage("Invitation créée. Copiez le lien sécurisé et envoyez-le au collaborateur.");
    } catch {
      setMessage("L’invitation n’a pas pu être créée. Seul le propriétaire de l’organisation peut inviter.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHead title="Équipe et agences" text="Créez une organisation, attribuez des rôles et partagez les biens avec vos collaborateurs." />
      {message && <p className="mb-4 rounded-2xl bg-[#f6fbfa] p-4 text-sm">{message}</p>}
      {organizations.length === 0 ? (
        canCreateOrganization ? (
          <form onSubmit={addOrganization} className="max-w-xl rounded-3xl border border-[#ebebeb] p-5">
            <h2 className="text-xl font-semibold">Créer votre organisation</h2>
            <p className="mt-2 text-sm text-[#6a6a6a]">Cette structure regroupe les biens, collaborateurs et données CRM de l’agence validée.</p>
            <input className={`${fieldClass} mt-4`} value={name} onChange={(event) => setName(event.target.value)} placeholder="Nom de l’agence ou de l’équipe" minLength={2} required />
            <button className={`${btnPrimary} mt-3`} disabled={busy}>Créer</button>
          </form>
        ) : (
          <section className="max-w-xl rounded-3xl border border-[#ebebeb] bg-[#FFFDF7] p-6">
            <h2 className="text-xl font-semibold">Compte multi-biens sur validation</h2>
            <p className="mt-2 text-sm leading-6 text-[#6a6a6a]">La création d’une agence et de ses accès ERP/CRM est ouverte par notre service client après contrôle de la structure.</p>
            <Link href="/agences" className={`${btnPrimary} mt-4`}>Contacter le service agence</Link>
          </section>
        )
      ) : (
        <>
          <select className={`${fieldClass} max-w-md`} value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
            {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
          </select>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-3xl border border-[#ebebeb] p-5">
              <h2 className="text-xl font-semibold">Membres</h2>
              <div className="mt-4 grid gap-2">
                {members.map((member) => (
                  <div key={member.user_id} className="flex items-center justify-between rounded-2xl bg-[#f7f7f7] p-3 text-sm">
                    <div>
                      <span className="font-medium">{member.profile?.full_name || `Compte ${member.user_id.slice(0, 8)}`}</span>
                      <p className="mt-1 text-xs text-[#6a6a6a]">{member.functional_domains.map((domain) => domains.find((item) => item.value === domain)?.label ?? domain).join(" · ")}</p>
                    </div>
                    <Pill>{member.role}</Pill>
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-3xl border border-[#ebebeb] p-5">
              <h2 className="text-xl font-semibold">Inviter un collaborateur</h2>
              <form onSubmit={invite} className="mt-4 grid gap-3">
                <input className={fieldClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="collaborateur@agence.sn" required />
                <select className={fieldClass} value={role} onChange={(event) => setRole(event.target.value as OrganizationInvitation["role"])}>
                  <option value="manager">Manager</option>
                  <option value="agent">Agent</option>
                  <option value="viewer">Lecture seule</option>
                </select>
                <fieldset>
                  <legend className="text-sm font-medium">Domaines fonctionnels</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {domains.map((domain) => (
                      <label key={domain.value} className="flex items-center gap-2 rounded-full border border-[#dddddd] px-3 py-2 text-xs">
                        <input
                          type="checkbox"
                          checked={functionalDomains.includes(domain.value)}
                          onChange={(event) => setFunctionalDomains((current) => event.target.checked
                            ? [...current, domain.value]
                            : current.filter((value) => value !== domain.value))}
                        />
                        {domain.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <button className={btnPrimary} disabled={busy || functionalDomains.length === 0}>Créer l’invitation</button>
              </form>
              <div className="mt-4 grid gap-2">
                {invitations.map((invitation) => {
                  const link = typeof window === "undefined" ? "" : `${window.location.origin}/invitation/${invitation.token}`;
                  return (
                    <div key={invitation.id} className="rounded-2xl bg-[#f7f7f7] p-3 text-sm">
                      <p className="font-medium">{invitation.email} · {invitation.role}</p>
                      <p className="mt-1 text-xs text-[#6a6a6a]">{invitation.functional_domains.map((domain) => domains.find((item) => item.value === domain)?.label ?? domain).join(" · ")}</p>
                      <button className={`${btnSecondary} mt-2`} onClick={() => void navigator.clipboard.writeText(link)}>Copier le lien</button>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
