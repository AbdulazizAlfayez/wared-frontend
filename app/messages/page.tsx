"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { Conversation, Message, PaginatedResponse } from "@/lib/types";
import {
  MessageSquare, Send, Loader2, ArrowLeft, MoreVertical,
  ShieldAlert, Search, Car,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

function Avatar({ name, size = "sm" }: { name?: string | null; size?: "sm" | "md" }) {
  const dim = size === "md" ? "w-9 h-9 text-xs" : "w-8 h-8 text-xs";
  const initials = (name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";
  return (
    <span className={`${dim} rounded-full bg-accent/10 text-accent font-semibold flex items-center justify-center flex-shrink-0`}>
      {initials}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Contact-pattern detector (mirrors backend masking patterns)
// ---------------------------------------------------------------------------
const _CONTACT_RE = new RegExp(
  [
    String.raw`(?:\+966|00966|05\d)[\d\s\-]{6,12}`,          // Saudi phones
    String.raw`\d[\d\s\-]{6,}\d`,                             // 7+ digit runs
    String.raw`[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}`,// emails
    String.raw`https?://\S+`,                                  // URLs
    String.raw`www\.\S+`,                                      // www domains
    String.raw`(?:wa\.me|t\.me|instagram\.com|snapchat\.com|tiktok\.com)/\S*`,
    String.raw`\S+\.(?:com|sa|net|org|io|me|co)\b`,           // bare domains
    String.raw`@[a-zA-Z0-9_]{2,}`,                            // @handles
    'whatsapp', String.raw`whats\s*app`, 'واتساب', 'واتس',
    'اتصل', 'رقمي', String.raw`رقم\s*جوال`, String.raw`تواصل\s*خارج`,
    'سناب', 'انستا', 'تليجرام', 'ايميل',
  ].join('|'),
  'iu',
);

function hasContactInfo(text: string): boolean {
  return _CONTACT_RE.test(text);
}

// ---------------------------------------------------------------------------
// Conversation list sidebar
// ---------------------------------------------------------------------------

function ConvList({
  conversations,
  selectedId,
  onSelect,
  search,
  onSearchChange,
}: {
  conversations: Conversation[];
  selectedId: number | null;
  onSelect: (c: Conversation) => void;
  search: string;
  onSearchChange: (v: string) => void;
}) {
  const filtered = conversations.filter((c) => {
    const name = c.other_party?.name ?? "";
    const car = `${c.listing?.make ?? ""} ${c.listing?.model ?? ""}`;
    const q = search.toLowerCase();
    return name.toLowerCase().includes(q) || car.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-accent bg-slate-50"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm px-4">
            {search ? "No conversations match your search." : "No messages yet."}
          </div>
        ) : (
          filtered.map((c) => {
            const isSelected = c.id === selectedId;
            const hasUnread = (c.unread_count ?? 0) > 0;
            const otherName = c.other_party?.name ?? "Unknown";
            const lastAt = c.last_message?.created_at ?? c.updated_at;
            const lastContent = c.last_message?.content ?? "";
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c)}
                className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-start gap-3 ${
                  isSelected ? "bg-accent/5 border-l-2 border-l-accent" : ""
                } ${hasUnread ? "bg-blue-50/40" : ""}`}
              >
                <Avatar name={otherName} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className={`text-sm truncate ${hasUnread ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`}>
                      {otherName}
                    </p>
                    <span className="text-[11px] text-slate-400 flex-shrink-0">
                      {timeAgo(lastAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    {c.listing?.make} {c.listing?.model} {c.listing?.year}
                  </p>
                  {lastContent && (
                    <p className={`text-xs truncate mt-0.5 ${hasUnread ? "text-slate-700 font-medium" : "text-slate-400"}`}>
                      {lastContent}
                    </p>
                  )}
                </div>
                {hasUnread && (
                  <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
                    {(c.unread_count ?? 0) > 9 ? "9+" : c.unread_count}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message thread panel
// ---------------------------------------------------------------------------

function MessageThread({
  conversation,
  onBack,
  onBlock,
}: {
  conversation: Conversation;
  onBack: () => void;
  onBlock: (conv: Conversation) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [contactWarning, setContactWarning] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const otherName = conversation.other_party?.name ?? "Unknown";
  const listing = conversation.listing;

  const fetchMessages = useCallback(async () => {
    try {
      const data = await api.get<PaginatedResponse<Message>>(
        `/api/conversations/${conversation.id}/messages/?page_size=100`
      );
      // API returns oldest-first (ordered by created_at), display as-is
      setMessages(data.results ?? []);
    } catch {
      // silently ignore polling errors
    } finally {
      setIsLoading(false);
    }
  }, [conversation.id]);

  useEffect(() => {
    setIsLoading(true);
    setMessages([]);
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 15_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Show warning when draft contains contact info
  useEffect(() => {
    setContactWarning(input.length > 3 && hasContactInfo(input));
  }, [input]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;
    setIsSending(true);
    setInput("");
    try {
      const msg = await api.post<Message>(
        `/api/conversations/${conversation.id}/messages/`,
        { content: text }
      );
      setMessages((prev) => [...prev, msg]);
    } catch {
      setInput(text); // restore on error
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const priceNum = listing?.price ? Number(listing.price) : null;
  const priceStr = priceNum
    ? new Intl.NumberFormat("en-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(priceNum)
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 bg-white flex items-center gap-3">
        <button
          onClick={onBack}
          className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Avatar name={otherName} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-sm">{otherName}</p>
          {listing && (
            <Link
              href={`/car/${listing.id}`}
              className="flex items-center gap-1 text-xs text-accent hover:underline"
            >
              <Car className="w-3 h-3" />
              {listing.make} {listing.model} {listing.year}
              {priceStr ? ` · ${priceStr}` : ""}
            </Link>
          )}
        </div>

        {/* Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-9 w-44 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-10">
              <button
                onClick={() => { setShowMenu(false); onBlock(conversation); }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <ShieldAlert className="w-4 h-4" />
                Block User
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-slate-50/30">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.is_system) {
              return (
                <div key={msg.id} className="flex justify-center">
                  <span className="text-[11px] text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                    {msg.content}
                  </span>
                </div>
              );
            }
            const isMine = msg.is_mine;
            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
                {!isMine && <Avatar name={msg.sender?.name} size="sm" />}
                <div className={`max-w-[70%] flex flex-col gap-1 ${isMine ? "items-end" : "items-start"}`}>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMine
                      ? "bg-accent text-white rounded-br-sm"
                      : "bg-white text-slate-900 border border-slate-100 rounded-bl-sm shadow-sm"
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-slate-400 px-1">
                    {timeAgo(msg.created_at)}
                    {isMine && <span className="ml-1">{msg.is_read ? " ✓✓" : " ✓"}</span>}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-100 bg-white">
        {contactWarning && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-2">
            للحماية، أبقِ التواصل داخل مركبة — أرقام الهاتف وروابط التواصل تُخفى تلقائياً.
          </p>
        )}
        {!conversation.is_active ? (
          <p className="text-center text-sm text-slate-400 py-1">
            This conversation is no longer active.
          </p>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (Enter to send)"
              rows={1}
              className="flex-1 resize-none px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-accent min-h-[42px] max-h-32"
              onInput={(e) => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = "auto";
                t.style.height = Math.min(t.scrollHeight, 128) + "px";
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              className="p-2.5 bg-accent hover:bg-accent-600 disabled:bg-accent/40 text-white rounded-xl transition-colors flex-shrink-0"
            >
              {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function MessagesPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [showThread, setShowThread] = useState(false);
  const [search, setSearch] = useState("");
  const deepLinkHandled = useRef(false);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/auth/signin");
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchConversations = useCallback(async () => {
    try {
      const data = await api.get<PaginatedResponse<Conversation>>(
        "/api/conversations/?page_size=100"
      );
      setConversations(data?.results ?? []);
      setFetchError(false);
    } catch {
      setFetchError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchConversations();
    else if (!authLoading) setIsLoading(false);
  }, [isAuthenticated, authLoading, fetchConversations]);

  // Deep-link: ?importer=<user_id>&car_id=<listing_id>
  // Get-or-create conversation with that importer for that car, then auto-select
  useEffect(() => {
    const importerParam = searchParams.get("importer");
    const carIdParam = searchParams.get("car_id");

    console.log("[MSG deep-link] effect fired", {
      deepLinkHandled: deepLinkHandled.current,
      isAuthenticated,
      isLoading,
      importerParam,
      carIdParam,
      conversationsCount: conversations.length,
    });

    if (deepLinkHandled.current) return;
    if (!isAuthenticated || isLoading) return;
    if (!importerParam || !carIdParam) return;

    deepLinkHandled.current = true;

    // First check if we already have a matching conversation loaded
    const importerId = Number(importerParam);
    const existing = conversations.find(
      (c) => c.other_party?.id === importerId && c.listing?.id === Number(carIdParam)
    );

    console.log("[MSG deep-link] existing conv match:", existing?.id ?? "none", "importerId:", importerId, "carId:", carIdParam);

    if (existing) {
      setSelected(existing);
      setShowThread(true);
      setConversations((prev) =>
        prev.map((x) => (x.id === existing.id ? { ...x, unread_count: 0 } : x))
      );
      router.replace("/messages", { scroll: false });
      return;
    }

    // Otherwise, call the get-or-create endpoint
    console.log("[MSG deep-link] calling POST /api/conversations/ with car_id:", Number(carIdParam));
    (async () => {
      try {
        const conv = await api.post<Conversation>("/api/conversations/", {
          car_id: Number(carIdParam),
        });
        console.log("[MSG deep-link] POST success, conv:", conv);
        // Add to conversations list if not already there
        setConversations((prev) => {
          const exists = prev.some((c) => c.id === conv.id);
          return exists ? prev : [conv, ...prev];
        });
        setSelected(conv);
        setShowThread(true);
      } catch (err: unknown) {
        console.error("[MSG deep-link] POST failed:", err);
        // If get-or-create fails (e.g. reservation required), find any existing conv with this importer
        const fallback = conversations.find((c) => c.other_party?.id === importerId);
        console.log("[MSG deep-link] fallback conv:", fallback?.id ?? "none");
        if (fallback) {
          setSelected(fallback);
          setShowThread(true);
        }
      } finally {
        router.replace("/messages", { scroll: false });
      }
    })();
  }, [isAuthenticated, isLoading, searchParams, conversations, router]);

  const handleSelect = (c: Conversation) => {
    setSelected(c);
    setShowThread(true);
    setConversations((prev) =>
      prev.map((x) => (x.id === c.id ? { ...x, unread_count: 0 } : x))
    );
  };

  const handleBlock = async (conv: Conversation) => {
    const otherId = conv.other_party?.id;
    if (!otherId) return;
    if (!confirm("Block this user? They will no longer be able to message you.")) return;
    try {
      // Backend expects { user_id: N }
      await api.post("/api/blocked-users/", { user_id: otherId });
      setSelected(null);
      setShowThread(false);
      fetchConversations();
    } catch {
      alert("Failed to block user.");
    }
  };

  // Show spinner while auth is loading OR while isAuthenticated but data not yet fetched
  if (authLoading || (isAuthenticated && isLoading && !fetchError)) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // Not logged in — redirect handled by useEffect, show nothing
  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          <p className="text-sm text-slate-500 mt-0.5">Your conversations with buyers and sellers</p>
        </div>

        {fetchError ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
            <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 mb-4">Could not load conversations. Please try again.</p>
            <button
              onClick={fetchConversations}
              className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-600 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex"
            style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}
          >
            {/* Left: Conversation list */}
            <div
              className={`w-full md:w-80 flex-shrink-0 border-r border-slate-100 flex flex-col ${
                showThread ? "hidden md:flex" : "flex"
              }`}
            >
              <div className="px-4 py-3 border-b border-slate-100">
                <h2 className="font-semibold text-slate-900 text-sm">
                  Conversations
                  {conversations.length > 0 && (
                    <span className="ml-2 text-slate-400 font-normal">({conversations.length})</span>
                  )}
                </h2>
              </div>

              {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-accent" />
                </div>
              ) : (
                <ConvList
                  conversations={conversations}
                  selectedId={selected?.id ?? null}
                  onSelect={handleSelect}
                  search={search}
                  onSearchChange={setSearch}
                />
              )}
            </div>

            {/* Right: Message thread */}
            <div
              className={`flex-1 flex flex-col min-w-0 ${
                showThread ? "flex" : "hidden md:flex"
              }`}
            >
              {selected ? (
                <MessageThread
                  key={selected.id}
                  conversation={selected}
                  onBack={() => setShowThread(false)}
                  onBlock={handleBlock}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                  <MessageSquare className="w-16 h-16 mb-4 text-slate-200" />
                  <p className="text-lg font-medium text-slate-500">Select a conversation</p>
                  <p className="text-sm mt-1">Choose a conversation from the list to start messaging.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
