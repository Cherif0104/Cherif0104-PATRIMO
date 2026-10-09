"use client";

import { useEffect, useState } from "react";
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
import type { Organization, OrganizationInvitation, OrganizationMember } from "@/lib/types";
import { useTitle } from "@/lib/use-title";

export default function TeamPage() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrganizationInvitation["role"]>("agent");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useTitle("Équipe · Se Loger au Sénégal");

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
        <form onSubmit={addOrganization} className="max-w-xl rounded-3xl border border-[#ebebeb] p-5">
          <h2 className="text-xl font-semibold">Créer votre organisation</h2>
          <input className={`${fieldClass} mt-4`} value={name} onChange={(event) => setName(event.target.value)} placeholder="Nom de l’agence ou de l’équipe" minLength={2} required />
          <button className={`${btnPrimary} mt-3`} disabled={busy}>Créer</button>
        </form>
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
                    <span>{member.profile?.full_name || `Compte ${member.user_id.slice(0, 8)}`}</span>
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
                <button className={btnPrimary} disabled={busy}>Créer l’invitation</button>
              </form>
              <div className="mt-4 grid gap-2">
                {invitations.map((invitation) => {
                  const link = typeof window === "undefined" ? "" : `${window.location.origin}/invitation/${invitation.token}`;
                  return (
                    <div key={invitation.id} className="rounded-2xl bg-[#f7f7f7] p-3 text-sm">
                      <p className="font-medium">{invitation.email} · {invitation.role}</p>
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
