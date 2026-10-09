"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { ArrowLeft, MessageCircle, Send, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { btnPrimary, cx, formatDateTime } from "@/lib/format";
import {
  loadConversations,
  loadMessages,
  markMessagesRead,
  sendMessage,
  subscribeToMessages,
} from "@/lib/supabase";
import type { Conversation, ConversationMessage } from "@/lib/types";
import { useTitle } from "@/lib/use-title";

function MessagesContent() {
  const params = useSearchParams();
  const { user, loading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState(params.get("conversation") ?? "");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  useTitle("Messages · Se Loger au Sénégal");

  useEffect(() => {
    if (!user) {
      setLoaded(true);
      return;
    }
    loadConversations()
      .then((rows) => {
        setConversations(rows);
        setSelectedId((current) => current || rows[0]?.id || "");
      })
      .catch(() => setError("La messagerie est momentanément indisponible."))
      .finally(() => setLoaded(true));
  }, [user]);

  useEffect(() => {
    if (!selectedId || !user) {
      setMessages([]);
      return;
    }
    let active = true;
    loadMessages(selectedId)
      .then((rows) => {
        if (active) setMessages(rows);
        return markMessagesRead(selectedId, user.id);
      })
      .catch(() => {
        if (active) setError("Les messages n’ont pas pu être chargés.");
      });
    const unsubscribe = subscribeToMessages(selectedId, (message) => {
      setMessages((current) =>
        current.some((item) => item.id === message.id) ? current : [...current, message],
      );
      if (message.sender_id !== user.id) void markMessagesRead(selectedId, user.id);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [selectedId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !selectedId || !body.trim()) return;
    const value = body.trim();
    setBody("");
    setBusy(true);
    setError("");
    try {
      const message = await sendMessage(selectedId, user.id, value);
      setMessages((current) =>
        current.some((item) => item.id === message.id) ? current : [...current, message],
      );
    } catch {
      setBody(value);
      setError("Le message n’a pas été envoyé. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !loaded) {
    return <p className="p-8 text-sm text-[#6a6a6a]">Ouverture de vos conversations…</p>;
  }

  if (!user) {
    return (
      <main className="mobile-page mx-auto max-w-lg px-5 py-24 text-center">
        <MessageCircle className="mx-auto h-14 w-14 text-[#FF385C]" />
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">Vos messages, en toute sécurité</h1>
        <p className="mt-3 text-sm leading-6 text-[#6a6a6a]">Connectez-vous pour échanger avec les propriétaires sans exposer vos coordonnées.</p>
        <Link href="/connexion?retour=/messages" className={`${btnPrimary} mt-7`}>Se connecter</Link>
      </main>
    );
  }

  const selected = conversations.find((conversation) => conversation.id === selectedId);

  return (
    <main className="mobile-page px-0 py-0 md:px-8 lg:py-10 xl:px-16">
      <div className="mx-auto grid h-[calc(100dvh-5rem)] max-w-6xl overflow-hidden border-[#e5e5e5] md:h-[720px] md:rounded-[28px] md:border lg:grid-cols-[340px_1fr]">
        <aside className={cx("border-r border-[#e5e5e5] bg-white", selectedId && "hidden lg:block")}>
          <div className="border-b border-[#eeeeee] px-5 py-5">
            <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
            <p className="mt-1 text-xs text-[#6a6a6a]">Échanges protégés entre voyageurs et propriétaires</p>
          </div>
          <div className="max-h-full overflow-y-auto p-2">
            {conversations.map((conversation) => {
              const other = conversation.guest_id === user.id ? conversation.host : conversation.guest;
              const image = conversation.listing?.data?.images?.[0];
              return (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedId(conversation.id)}
                  className={cx("flex w-full gap-3 rounded-2xl p-3 text-left hover:bg-[#f7f7f7]", selectedId === conversation.id && "bg-[#fff1f3]")}
                >
                  {image ? <img src={image} alt="" className="h-14 w-14 rounded-xl object-cover" /> : <span className="grid h-14 w-14 place-items-center rounded-xl bg-[#f2f2f2]"><MessageCircle /></span>}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{other?.full_name || "Membre vérifié"}</span>
                    <span className="mt-1 block truncate text-xs text-[#6a6a6a]">{conversation.listing?.title || "Annonce"}</span>
                  </span>
                </button>
              );
            })}
            {conversations.length === 0 && (
              <div className="px-5 py-16 text-center">
                <MessageCircle className="mx-auto h-10 w-10 text-[#FF385C]" />
                <p className="mt-4 text-sm font-semibold">Aucune conversation</p>
                <p className="mt-2 text-xs leading-5 text-[#6a6a6a]">Ouvrez une annonce publiée pour contacter son propriétaire.</p>
                <Link href="/explorer" className="mt-4 inline-block text-sm font-semibold underline">Explorer les logements</Link>
              </div>
            )}
          </div>
        </aside>
        <section className={cx("min-w-0 bg-white", !selectedId && "hidden lg:flex lg:items-center lg:justify-center")}>
          {selected ? (
            <div className="flex h-full flex-col">
              <header className="flex items-center gap-3 border-b border-[#eeeeee] px-4 py-3">
                <button className="grid h-10 w-10 place-items-center rounded-full hover:bg-[#f2f2f2] lg:hidden" onClick={() => setSelectedId("")} aria-label="Retour aux conversations"><ArrowLeft className="h-5 w-5" /></button>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{selected.listing?.title || "Annonce"}</p>
                  <p className="truncate text-xs text-[#6a6a6a]">{selected.listing?.neighborhood}, {selected.listing?.city}</p>
                </div>
                <ShieldCheck className="ml-auto h-5 w-5 text-[#16836f]" aria-label="Conversation protégée" />
              </header>
              <div className="flex-1 overflow-y-auto bg-[#fafafa] px-4 py-5">
                <div className="mx-auto max-w-2xl space-y-3">
                  {messages.map((message) => {
                    const mine = message.sender_id === user.id;
                    return (
                      <div key={message.id} className={cx("flex", mine ? "justify-end" : "justify-start")}>
                        <div className={cx("max-w-[82%] rounded-[20px] px-4 py-3 text-sm leading-6 shadow-sm", mine ? "rounded-br-md bg-[#222] text-white" : "rounded-bl-md bg-white")}>
                          <p className="whitespace-pre-wrap break-words">{message.body}</p>
                          <p className={cx("mt-1 text-[10px]", mine ? "text-white/60" : "text-[#8a8a8a]")}>{formatDateTime(message.created_at)}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              </div>
              <form onSubmit={submit} className="flex gap-2 border-t border-[#eeeeee] p-3">
                <label className="sr-only" htmlFor="message-body">Votre message</label>
                <textarea id="message-body" rows={1} maxLength={4000} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Écrivez votre message…" className="max-h-32 min-h-12 flex-1 resize-none rounded-2xl border border-[#dddddd] px-4 py-3 text-sm outline-none focus:border-[#222]" />
                <button disabled={busy || !body.trim()} className="grid h-12 w-12 place-items-center rounded-full bg-[#FF385C] text-white disabled:opacity-40" aria-label="Envoyer"><Send className="h-5 w-5" /></button>
              </form>
            </div>
          ) : (
            <div className="text-center">
              <MessageCircle className="mx-auto h-14 w-14 text-[#FF385C]" />
              <p className="mt-4 font-semibold">Sélectionnez une conversation</p>
            </div>
          )}
        </section>
      </div>
      {error && <p role="alert" className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#222] px-4 py-2 text-sm text-white shadow-lg">{error}</p>}
    </main>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-[#6a6a6a]">Ouverture de vos conversations…</p>}>
      <MessagesContent />
    </Suspense>
  );
}
