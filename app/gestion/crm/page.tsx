"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, MessageCircle, Plus, Upload, Users } from "lucide-react";
import { PageHead, Pill } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { btnPrimary, btnSecondary, fieldClass, formatDate, formatMoney } from "@/lib/format";
import {
  createCrmContact,
  createCrmInteraction,
  createCrmOpportunity,
  importCrmContacts,
  loadCrmContacts,
  loadCrmInteractions,
  loadCrmOpportunities,
  loadOrganizations,
  updateCrmContactQualification,
  updateCrmOpportunityStage,
} from "@/lib/supabase";
import type { CrmContact, CrmInteraction, CrmOpportunity, Organization } from "@/lib/types";

const stages: CrmOpportunity["stage"][] = ["nouveau", "qualifie", "visite", "negociation", "gagne", "perdu"];

export default function CrmPage() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [interactions, setInteractions] = useState<CrmInteraction[]>([]);
  const [opportunities, setOpportunities] = useState<CrmOpportunity[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [kind, setKind] = useState<CrmContact["contact_kind"]>("prospect");
  const [summary, setSummary] = useState("");
  const [channel, setChannel] = useState<CrmInteraction["channel"]>("appel");
  const [outcome, setOutcome] = useState<CrmInteraction["outcome"]>("information");
  const [nextAction, setNextAction] = useState("");
  const [opportunityTitle, setOpportunityTitle] = useState("");
  const [opportunityValue, setOpportunityValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadOrganizations()
      .then((rows) => {
        setOrganizations(rows);
        setOrganizationId(rows[0]?.id ?? "");
      })
      .catch(() => setMessage("Aucune organisation CRM accessible."));
  }, []);

  useEffect(() => {
    if (!organizationId) return;
    Promise.all([
      loadCrmContacts(organizationId),
      loadCrmInteractions(organizationId),
      loadCrmOpportunities(organizationId),
    ]).then(([contactRows, interactionRows, opportunityRows]) => {
      setContacts(contactRows);
      setInteractions(interactionRows);
      setOpportunities(opportunityRows);
      setSelectedId((current) => current || contactRows[0]?.id || "");
    }).catch(() => setMessage("Les données CRM ne peuvent pas être chargées."));
  }, [organizationId]);

  const selected = contacts.find((contact) => contact.id === selectedId);
  const visibleContacts = useMemo(() => contacts.filter((contact) => {
    const haystack = `${contact.full_name} ${contact.email ?? ""} ${contact.phone ?? ""} ${contact.tags.join(" ")}`.toLowerCase();
    return haystack.includes(query.toLowerCase().trim());
  }), [contacts, query]);

  async function addContact(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !organizationId || (!email && !phone)) return;
    setBusy(true);
    setMessage("");
    try {
      const contact = await createCrmContact({ organizationId, userId: user.id, fullName, email, phone, kind });
      setContacts((rows) => [contact, ...rows]);
      setSelectedId(contact.id);
      setFullName("");
      setEmail("");
      setPhone("");
      setFormOpen(false);
    } catch {
      setMessage("Le contact n’a pas pu être ajouté.");
    } finally {
      setBusy(false);
    }
  }

  async function addInteraction(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !selected || summary.trim().length < 2) return;
    setBusy(true);
    try {
      const interaction = await createCrmInteraction({
        organizationId,
        contactId: selected.id,
        userId: user.id,
        channel,
        direction: "sortant",
        outcome,
        summary,
        nextActionAt: nextAction ? new Date(nextAction).toISOString() : undefined,
      });
      setInteractions((rows) => [interaction, ...rows]);
      setSummary("");
      setNextAction("");
    } catch {
      setMessage("L’interaction n’a pas pu être enregistrée.");
    } finally {
      setBusy(false);
    }
  }

  async function qualify(qualification: CrmContact["qualification"]) {
    if (!selected) return;
    const score = { nouveau: 10, a_qualifier: 25, qualifie: 55, prioritaire: 85, inactif: 0 }[qualification];
    const updated = await updateCrmContactQualification(selected.id, qualification, score);
    setContacts((rows) => rows.map((row) => row.id === updated.id ? updated : row));
  }

  async function addOpportunity(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !selected || opportunityTitle.trim().length < 2) return;
    const created = await createCrmOpportunity({
      organizationId,
      contactId: selected.id,
      userId: user.id,
      title: opportunityTitle,
      value: Number(opportunityValue) || undefined,
    });
    setOpportunities((rows) => [created, ...rows]);
    setOpportunityTitle("");
    setOpportunityValue("");
  }

  async function moveOpportunity(opportunity: CrmOpportunity, stage: CrmOpportunity["stage"]) {
    const updated = await updateCrmOpportunityStage(opportunity.id, stage);
    setOpportunities((rows) => rows.map((row) => row.id === updated.id ? updated : row));
  }

  async function importCsv(file: File) {
    if (!user || !organizationId) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const rows = lines.slice(1).map((line) => {
      const [name, rowEmail, rowPhone, rowKind] = parseCsvLine(line);
      return { fullName: name, email: rowEmail, phone: rowPhone, kind: rowKind };
    }).filter((row) => row.fullName && (row.email || row.phone));
    if (!rows.length) {
      setMessage("Le CSV doit contenir : nom,email,telephone,type.");
      return;
    }
    const created = await importCrmContacts(organizationId, user.id, rows);
    setContacts((current) => [...created, ...current]);
    setMessage(`${created.length} contacts importés.`);
  }

  function exportCsv() {
    const header = "nom,email,telephone,type,qualification,score\n";
    const body = contacts.map((contact) => [
      contact.full_name,
      contact.email ?? "",
      contact.phone ?? "",
      contact.contact_kind,
      contact.qualification,
      String(contact.score),
    ].map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([header + body], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `crm-contacts-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHead
        eyebrow="ERP · Relation client"
        title="CRM immobilier"
        text="Contacts, qualification, historique multicanal, relances et opportunités restent rattachés à votre structure."
        action={<button className={btnPrimary} onClick={() => setFormOpen((value) => !value)}><Plus className="h-4 w-4" /> Nouveau contact</button>}
      />
      {message && <p className="mb-4 rounded-xl bg-[#FFF8ED] px-4 py-3 text-sm">{message}</p>}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <select className={`${fieldClass} max-w-sm`} value={organizationId} onChange={(event) => setOrganizationId(event.target.value)}>
          {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
        </select>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => event.target.files?.[0] && void importCsv(event.target.files[0])} />
        <button className={btnSecondary} onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> Importer CSV</button>
        <button className={btnSecondary} onClick={exportCsv} disabled={!contacts.length}><Download className="h-4 w-4" /> Exporter</button>
      </div>

      {formOpen && (
        <form onSubmit={addContact} className="mb-6 grid gap-3 rounded-[22px] border border-[#e5e5e5] bg-[#FFFDF7] p-5 md:grid-cols-2">
          <input className={fieldClass} value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Nom complet" minLength={2} required />
          <select className={fieldClass} value={kind} onChange={(event) => setKind(event.target.value as CrmContact["contact_kind"])}>
            <option value="prospect">Prospect</option><option value="client">Client</option><option value="proprietaire">Propriétaire</option><option value="investisseur">Investisseur</option><option value="partenaire">Partenaire</option>
          </select>
          <input className={fieldClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-mail" />
          <input className={fieldClass} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Téléphone ou WhatsApp" />
          <button className={`${btnPrimary} md:col-span-2`} disabled={busy || (!email && !phone)}>Créer le contact</button>
        </form>
      )}

      <div className="grid min-h-[680px] overflow-hidden rounded-[24px] border border-[#e5e5e5] bg-white xl:grid-cols-[320px_1fr]">
        <aside className="border-b border-[#e5e5e5] p-4 xl:border-b-0 xl:border-r">
          <div className="relative">
            <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6a6a6a]" />
            <input className={`${fieldClass} pl-9`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un contact" />
          </div>
          <div className="mt-3 grid max-h-[600px] gap-1 overflow-auto">
            {visibleContacts.map((contact) => (
              <button key={contact.id} onClick={() => setSelectedId(contact.id)} className={`rounded-xl p-3 text-left ${selectedId === contact.id ? "bg-[#FFF1EE]" : "hover:bg-[#f7f7f7]"}`}>
                <span className="block text-sm font-semibold">{contact.full_name}</span>
                <span className="mt-1 block text-xs text-[#6a6a6a]">{contact.contact_kind} · score {contact.score}</span>
              </button>
            ))}
            {!visibleContacts.length && <p className="p-4 text-sm text-[#6a6a6a]">Aucun contact.</p>}
          </div>
        </aside>

        <section className="p-5 md:p-7">
          {!selected ? <div className="grid h-full place-items-center text-sm text-[#6a6a6a]">Sélectionnez ou créez un contact.</div> : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">{selected.full_name}</h2>
                  <p className="mt-1 text-sm text-[#6a6a6a]">{selected.email || selected.phone}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select className={`${fieldClass} w-auto`} value={selected.qualification} onChange={(event) => void qualify(event.target.value as CrmContact["qualification"])}>
                    <option value="nouveau">Nouveau</option><option value="a_qualifier">À qualifier</option><option value="qualifie">Qualifié</option><option value="prioritaire">Prioritaire</option><option value="inactif">Inactif</option>
                  </select>
                  {selected.phone && <a href={`https://wa.me/${selected.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#16836f] px-4 py-2.5 text-sm font-semibold text-white"><MessageCircle className="h-4 w-4" /> WhatsApp</a>}
                </div>
              </div>

              <div className="mt-7 grid gap-6 2xl:grid-cols-2">
                <section>
                  <h3 className="font-bold">Nouvelle interaction</h3>
                  <form onSubmit={addInteraction} className="mt-3 grid gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <select className={fieldClass} value={channel} onChange={(event) => setChannel(event.target.value as CrmInteraction["channel"])}><option value="appel">Appel</option><option value="whatsapp">WhatsApp</option><option value="email">E-mail</option><option value="visite">Visite</option><option value="message">Message</option><option value="note">Note</option></select>
                      <select className={fieldClass} value={outcome} onChange={(event) => setOutcome(event.target.value as CrmInteraction["outcome"])}><option value="information">Information</option><option value="a_relancer">À relancer</option><option value="rendez_vous">Rendez-vous</option><option value="interesse">Intéressé</option><option value="non_interesse">Non intéressé</option><option value="conclu">Conclu</option></select>
                    </div>
                    <textarea className={`${fieldClass} min-h-24`} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Résumé factuel de l’échange" required />
                    <label className="text-xs font-medium">Prochaine action<input className={`${fieldClass} mt-1`} type="datetime-local" value={nextAction} onChange={(event) => setNextAction(event.target.value)} /></label>
                    <button className={btnPrimary} disabled={busy || summary.trim().length < 2}>Enregistrer l’interaction</button>
                  </form>
                  <div className="mt-4 grid gap-2">
                    {interactions.filter((row) => row.contact_id === selected.id).slice(0, 8).map((interaction) => (
                      <article key={interaction.id} className="rounded-xl bg-[#f7f8f8] p-3">
                        <div className="flex justify-between gap-3"><strong className="text-sm">{interaction.channel} · {interaction.outcome}</strong><span className="text-xs text-[#6a6a6a]">{formatDate(interaction.occurred_at)}</span></div>
                        <p className="mt-1 text-sm text-[#5f6870]">{interaction.summary}</p>
                      </article>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="font-bold">Opportunités</h3>
                  <form onSubmit={addOpportunity} className="mt-3 grid grid-cols-[1fr_140px_auto] gap-2">
                    <input className={fieldClass} value={opportunityTitle} onChange={(event) => setOpportunityTitle(event.target.value)} placeholder="Location villa, mandat…" required />
                    <input className={fieldClass} inputMode="numeric" value={opportunityValue} onChange={(event) => setOpportunityValue(event.target.value.replace(/\D/g, ""))} placeholder="Valeur FCFA" />
                    <button className={btnSecondary}><Plus className="h-4 w-4" /></button>
                  </form>
                  <div className="mt-4 grid gap-3">
                    {opportunities.filter((row) => row.contact_id === selected.id).map((opportunity) => (
                      <article key={opportunity.id} className="rounded-xl border border-[#e5e5e5] p-3">
                        <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{opportunity.title}</p>{opportunity.value !== null && <p className="mt-1 text-sm">{formatMoney(opportunity.value, opportunity.currency)}</p>}</div><Pill>{opportunity.probability} %</Pill></div>
                        <select className={`${fieldClass} mt-3`} value={opportunity.stage} onChange={(event) => void moveOpportunity(opportunity, event.target.value as CrmOpportunity["stage"])}>{stages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}</select>
                      </article>
                    ))}
                  </div>
                </section>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function csvCell(value: string) {
  return `"${value.replaceAll("\"", "\"\"")}"`;
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === "\"" && line[index + 1] === "\"") {
      value += "\"";
      index += 1;
    } else if (char === "\"") quoted = !quoted;
    else if (char === "," && !quoted) {
      cells.push(value.trim());
      value = "";
    } else value += char;
  }
  cells.push(value.trim());
  return cells;
}
