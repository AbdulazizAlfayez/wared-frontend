"use client";

import {
  useState, useEffect, useRef, useCallback, type KeyboardEvent,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import {
  Loader2, X, MessageSquarePlus, Send, Bot,
  Car as CarIcon, MapPin, ArrowRight, Package,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CarCard {
  id: number; make: string; model: string; year: number;
  price: string; source_country: string; city: string;
  image: string | null; url: string;
}

interface CarsMeta {
  total_matches: number;
  params: Record<string, unknown>;
}

interface OrderCard {
  id: number; order_number: string; car: string;
  image: string | null; status: string; payment_status: string;
  url: string;
}

interface Cards {
  cars: CarCard[];
  cars_meta: CarsMeta | null;
  orders: OrderCard[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  cards?: Cards;
}

interface ChatResponse {
  reply: string;
  conversation_id?: number;
  cars: CarCard[];
  cars_meta: CarsMeta | null;
  orders: OrderCard[];
}

interface ConversationDetail {
  id: number;
  messages: { role: string; content: string; meta?: Cards }[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const MAX_CHARS = 2000;
const CID_KEY = "wared_assistant_cid";

const COUNTRY_FLAGS: Record<string, string> = {
  usa: "🇺🇸", american: "🇺🇸", japan: "🇯🇵", japanese: "🇯🇵",
  korea: "🇰🇷", korean: "🇰🇷", uae: "🇦🇪", europe: "🇪🇺",
  european: "🇪🇺", canada: "🇨🇦", saudi: "🇸🇦", local: "🇸🇦",
  gcc: "🇸🇦",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700", deposit_requested: "bg-yellow-100 text-yellow-800",
  deposit_paid: "bg-blue-100 text-blue-700", confirmed: "bg-blue-100 text-blue-700",
  sourcing: "bg-slate-100 text-slate-700", purchased: "bg-slate-100 text-slate-700",
  preparing_shipment: "bg-slate-100 text-slate-700", shipped: "bg-indigo-100 text-indigo-700",
  arrived_port: "bg-purple-100 text-purple-700", in_customs: "bg-orange-100 text-orange-700",
  customs_cleared: "bg-slate-100 text-slate-700", inspection: "bg-orange-100 text-orange-700",
  ready: "bg-green-100 text-green-700", delivered: "bg-green-100 text-green-700",
  completed: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-600",
  refunded: "bg-slate-100 text-slate-600",
};

const PIPELINE = [
  "pending", "deposit_requested", "deposit_paid", "confirmed", "sourcing",
  "purchased", "preparing_shipment", "shipped", "arrived_port", "in_customs",
  "customs_cleared", "inspection", "ready", "delivered", "completed",
];

const PAYMENT_COLORS: Record<string, string> = {
  awaiting_payment: "bg-yellow-50 text-yellow-700 border-yellow-200",
  deposit_paid: "bg-blue-50 text-blue-700 border-blue-200",
  under_review: "bg-amber-50 text-amber-700 border-amber-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  refunded: "bg-slate-50 text-slate-600 border-slate-200",
};

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[1]) : "";
}

function apiHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const csrf = getCookie("csrftoken");
  if (csrf) headers["X-CSRFToken"] = csrf;
  headers["Accept-Language"] = typeof localStorage !== "undefined" ? localStorage.getItem("lang") || "en" : "en";
  return headers;
}

async function chatRequest(body: Record<string, unknown>): Promise<{ data?: ChatResponse; status: number }> {
  try {
    const res = await fetch(`${BASE_URL}/api/assistant/chat/`, {
      method: "POST", credentials: "include", headers: apiHeaders(),
      body: JSON.stringify(body),
    });
    if (res.status === 429) return { status: 429 };
    if (res.status === 503) return { status: 503 };
    if (!res.ok) { console.warn("[Assistant] API", res.status); return { status: res.status }; }
    return { data: await res.json(), status: 200 };
  } catch (err) { console.error("[Assistant] fetch error:", err); return { status: 0 }; }
}

async function fetchConversation(id: number): Promise<ConversationDetail | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/assistant/conversations/${id}/`, {
      credentials: "include", headers: apiHeaders(),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

// ---------------------------------------------------------------------------
// Markdown-lite renderer
// ---------------------------------------------------------------------------

function renderAssistantText(text: string) {
  return <>{text.split("\n").map((line, i) => {
    if (!line && i > 0) return <br key={`br-${i}`} />;
    return <span key={`l-${i}`}>{renderInline(line)}{i < text.split("\n").length - 1 && <br />}</span>;
  })}</>;
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let cleaned = text;
  let isHeading = false;
  if (/^#{1,3}\s/.test(cleaned)) { cleaned = cleaned.replace(/^#{1,3}\s+/, ""); isHeading = true; }
  const regex = /(\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(cleaned)) !== null) {
    if (match.index > lastIndex) parts.push(cleaned.slice(lastIndex, match.index));
    if (match[2]) parts.push(<strong key={`b-${match.index}`}>{match[2]}</strong>);
    else if (match[3] && match[4]) {
      const href = match[4];
      if (href.startsWith("/")) parts.push(<Link key={`lk-${match.index}`} href={href} className="text-accent underline underline-offset-2">{match[3]}</Link>);
      else parts.push(match[3]);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < cleaned.length) parts.push(cleaned.slice(lastIndex));
  return isHeading ? [<strong key="h">{parts}</strong>] : parts;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: "600ms" }} />
      ))}
    </span>
  );
}

function countryFlag(source: string): string {
  if (!source) return "🌍";
  const key = source.toLowerCase().replace(/[^a-z]/g, "");
  for (const [k, v] of Object.entries(COUNTRY_FLAGS)) {
    if (key.includes(k)) return v;
  }
  return "🌍";
}

function buildBrowseUrl(params: Record<string, unknown>): string {
  const map: Record<string, string> = {
    make: "make", model: "model", price_min: "minPrice", price_max: "maxPrice",
    year_min: "minYear", year_max: "maxYear", body_type: "bodyType",
  };
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "" && map[k]) q.set(map[k], String(v));
  }
  const qs = q.toString();
  return qs ? `/browse?${qs}` : "/browse";
}

// Car card for carousel
function CarCardWidget({ car }: { car: CarCard }) {
  return (
    <Link href={car.url} className="block w-[210px] flex-shrink-0 snap-start group">
      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c2128] transition-all hover:-translate-y-0.5 hover:shadow-md h-full flex flex-col">
        <div className="relative aspect-[16/10] bg-slate-100 dark:bg-slate-800 overflow-hidden">
          {car.image ? (
            <Image src={car.image} alt={`${car.make} ${car.model}`} fill className="object-cover" sizes="210px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <CarIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
          )}
        </div>
        <div className="p-2.5 flex-1 flex flex-col gap-1">
          <p className="text-[12px] font-semibold text-[var(--foreground)] leading-tight truncate">
            {car.make} {car.model}
          </p>
          <p className="text-[11px] text-slate-400">{car.year}</p>
          <p className="text-[13px] font-bold text-[var(--foreground)] mt-auto">{car.price}</p>
          {(car.source_country || car.city) && (
            <p className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
              {car.source_country && <span>{countryFlag(car.source_country)}</span>}
              {car.city && <><MapPin className="w-2.5 h-2.5 inline" />{car.city}</>}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

// "View all" card
function ViewAllCard({ total, params, t }: { total: number; params: Record<string, unknown>; t: (k: string) => string }) {
  return (
    <Link href={buildBrowseUrl(params)}
      className="w-[210px] flex-shrink-0 snap-start rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center gap-2 min-h-[180px] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
      <ArrowRight className="w-5 h-5 text-slate-400" />
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 text-center px-3">
        {t("assistant.viewAll").replace("{n}", String(total))}
      </p>
    </Link>
  );
}

// Car carousel
function CarCarousel({ cars, meta, t }: { cars: CarCard[]; meta: CarsMeta | null; t: (k: string) => string }) {
  if (!cars.length) return null;
  const showViewAll = meta && meta.total_matches > cars.length;
  return (
    <div className="mt-2 -mx-1 px-1">
      <div className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 scrollbar-hide"
        style={{ WebkitOverflowScrolling: "touch" }}>
        {cars.map((car) => <CarCardWidget key={car.id} car={car} />)}
        {showViewAll && <ViewAllCard total={meta!.total_matches} params={meta!.params} t={t} />}
      </div>
    </div>
  );
}

// Order card
function OrderCardWidget({ order, t }: { order: OrderCard; t: (k: string) => string }) {
  const statusKey = order.status.toLowerCase().replace(/\s+/g, "_");
  const statusCls = STATUS_COLORS[statusKey] ?? "bg-slate-100 text-slate-600";
  const paymentCls = PAYMENT_COLORS[order.payment_status] ?? "bg-slate-50 text-slate-600 border-slate-200";
  const pipelineIdx = PIPELINE.indexOf(statusKey);
  const progress = pipelineIdx >= 0 ? Math.round(((pipelineIdx + 1) / PIPELINE.length) * 100) : 0;

  return (
    <Link href={order.url} className="block mt-2 group">
      <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c2128] hover:shadow-md transition-all">
        {/* Thumbnail */}
        <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
          {order.image ? (
            <Image src={order.image} alt={order.car} fill className="object-cover" sizes="64px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-4 h-4 text-slate-300 dark:text-slate-600" />
            </div>
          )}
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-[var(--foreground)] truncate">{order.car}</p>
          <p className="text-[10px] text-slate-400 font-mono">{order.order_number}</p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${statusCls}`}>
              {order.status}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium border ${paymentCls}`}>
              {order.payment_status.replace(/_/g, " ")}
            </span>
          </div>
          {/* Progress bar */}
          {progress > 0 && (
            <div className="mt-1.5 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-accent flex-shrink-0 transition-colors" />
      </div>
    </Link>
  );
}

function OrderCards({ orders, t }: { orders: OrderCard[]; t: (k: string) => string }) {
  if (!orders.length) return null;
  return <div>{orders.map((o) => <OrderCardWidget key={o.id} order={o} t={t} />)}</div>;
}

// ---------------------------------------------------------------------------
// Widget
// ---------------------------------------------------------------------------

export default function AssistantWidget() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prevAuth = useRef(isAuthenticated);
  const isUserScrolledUp = useRef(false);

  // Restore conversation_id from sessionStorage
  useEffect(() => {
    if (isAuthenticated) {
      const stored = sessionStorage.getItem(CID_KEY);
      if (stored) setConversationId(Number(stored));
    }
  }, [isAuthenticated]);

  // Reset thread on auth change
  useEffect(() => {
    if (prevAuth.current !== isAuthenticated) {
      setMessages([]); setConversationId(null); setHistoryLoaded(false);
      sessionStorage.removeItem(CID_KEY); setError(null);
      prevAuth.current = isAuthenticated;
    }
  }, [isAuthenticated]);

  // History restore when panel opens
  useEffect(() => {
    if (!isOpen || !isAuthenticated || !conversationId || historyLoaded || messages.length > 0) return;
    setHistoryLoaded(true);
    (async () => {
      const conv = await fetchConversation(conversationId);
      if (!conv) { setConversationId(null); sessionStorage.removeItem(CID_KEY); return; }
      const restored: ChatMessage[] = conv.messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
          cards: m.meta && (m.meta.cars?.length || m.meta.orders?.length) ? m.meta : undefined,
        }));
      if (restored.length) setMessages(restored);
    })();
  }, [isOpen, isAuthenticated, conversationId, historyLoaded, messages.length]);

  // Smart auto-scroll: only scroll down if user hasn't scrolled up
  useEffect(() => {
    if (!isUserScrolledUp.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isSending]);

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    isUserScrolledUp.current = !atBottom;
  }, []);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) { setHasUnread(false); setTimeout(() => inputRef.current?.focus(), 100); }
  }, [isOpen]);

  // Esc to close
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape" && isOpen) setIsOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  const handleNewChat = useCallback(() => {
    setMessages([]); setConversationId(null); setHistoryLoaded(false);
    sessionStorage.removeItem(CID_KEY); setError(null);
  }, []);

  // Send
  const handleSend = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isSending) return;

    setInput(""); setError(null);
    const userMsg: ChatMessage = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);
    isUserScrolledUp.current = false;

    const body: Record<string, unknown> = { message: msg };
    if (isAuthenticated) {
      if (conversationId) body.conversation_id = conversationId;
    } else {
      const allMsgs = [...messages, userMsg];
      body.history = allMsgs.slice(-10).map(({ role, content }) => ({ role, content }));
    }

    const { data, status } = await chatRequest(body);

    if (status === 429) { setError(t("assistant.rateLimited")); setIsSending(false); return; }
    if (status === 503 || status === 0) { setError(t("assistant.unavailable")); setIsSending(false); return; }
    if (!data) { setError(t("assistant.unavailable") + ` (${status})`); setIsSending(false); return; }

    const cards: Cards | undefined =
      (data.cars?.length || data.orders?.length)
        ? { cars: data.cars || [], cars_meta: data.cars_meta, orders: data.orders || [] }
        : undefined;

    setMessages((prev) => [...prev, { role: "assistant", content: data.reply, cards }]);

    if (data.conversation_id && isAuthenticated) {
      setConversationId(data.conversation_id);
      sessionStorage.setItem(CID_KEY, String(data.conversation_id));
    }

    if (!isOpen) setHasUnread(true);
    setIsSending(false);
  }, [input, isSending, isAuthenticated, conversationId, messages, t, isOpen]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Quick prompts
  const quickPrompts = isAuthenticated
    ? [
        { key: "assistant.quickOrder", fallback: "Where is my order?" },
        { key: "assistant.quickPayment", fallback: "What do I pay next?" },
        { key: "assistant.quickCar", fallback: "Find me a car under 100k" },
      ]
    : [
        { key: "assistant.quickHow", fallback: "How does buying a car work?" },
        { key: "assistant.quickCar", fallback: "Find me a car under 100k" },
        { key: "assistant.quickSafe", fallback: "Is it safe to pay?" },
      ];

  const firstName = user?.name?.split(" ")[0] || "";

  return (
    <>
      {/* ── Floating button ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label={t("assistant.open")}
          className="fixed bottom-6 z-[90] w-14 h-14 rounded-full bg-[#0a0a0a] dark:bg-white text-white dark:text-[#0a0a0a] shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center"
          style={{ insetInlineEnd: "1.5rem" }}
        >
          <Bot className="w-6 h-6" />
          <span className="absolute -top-1 -end-1 w-5 h-5 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center border-2 border-white dark:border-[#161B22]">
            AI
          </span>
          {hasUnread && (
            <span className="absolute top-0 end-0 w-3 h-3 rounded-full bg-red-500 border-2 border-white dark:border-[#161B22] animate-pulse" />
          )}
        </button>
      )}

      {/* ── Panel ── */}
      {isOpen && (
        <div
          role="dialog"
          aria-label={t("assistant.title")}
          className="fixed z-[91] flex flex-col
            bottom-0 start-0 end-0 top-0
            md:bottom-24 md:top-auto md:start-auto md:w-[400px] md:h-[580px] md:rounded-2xl
            bg-[var(--surface)] dark:bg-[#161B22]
            border border-[var(--border)] dark:border-[rgba(255,255,255,0.08)]
            shadow-2xl overflow-hidden"
          style={{ insetInlineEnd: "1.5rem" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] dark:border-[rgba(255,255,255,0.08)] bg-[var(--surface)] dark:bg-[#161B22] flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#0a0a0a] dark:bg-white flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white dark:text-[#0a0a0a]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[var(--foreground)]">{t("assistant.title")}</h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">{t("assistant.subtitle")}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={handleNewChat} aria-label={t("assistant.newChat")}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors" title={t("assistant.newChat")}>
                <MessageSquarePlus className="w-4 h-4" />
              </button>
              <button onClick={() => setIsOpen(false)} aria-label={t("common.close") || "Close"}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={messagesContainerRef} onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth">
            {messages.length === 0 && !isSending ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-2">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                  <Bot className="w-6 h-6 text-slate-400" />
                </div>
                {isAuthenticated && firstName ? (
                  <p className="text-sm font-medium text-[var(--foreground)] mb-1">
                    {t("assistant.welcomeBack").replace("{name}", firstName)} 👋
                  </p>
                ) : (
                  <p className="text-sm font-medium text-[var(--foreground)] mb-1">{t("assistant.greeting")}</p>
                )}
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">{t("assistant.greetingSub")}</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {quickPrompts.map((qp) => (
                    <button key={qp.key} onClick={() => handleSend(t(qp.key) || qp.fallback)}
                      className="px-3 py-1.5 text-xs font-medium rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                      {t(qp.key) || qp.fallback}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div key={i} className="animate-fadeSlideIn" style={{ animationDelay: `${Math.min(i * 30, 150)}ms` }}>
                    <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] px-3.5 py-2.5 text-[13px] leading-relaxed rounded-2xl ${
                        msg.role === "user"
                          ? "bg-[#0a0a0a] text-white dark:bg-white dark:text-[#0a0a0a] rounded-ee-sm"
                          : "bg-slate-100 dark:bg-slate-800 text-[var(--foreground)] rounded-es-sm"
                      }`}>
                        {msg.role === "assistant" ? renderAssistantText(msg.content) : msg.content}
                      </div>
                    </div>
                    {/* Cards under assistant messages */}
                    {msg.role === "assistant" && msg.cards && (
                      <div className="ps-0">
                        <CarCarousel cars={msg.cards.cars} meta={msg.cards.cars_meta} t={t} />
                        <OrderCards orders={msg.cards.orders} t={t} />
                      </div>
                    )}
                  </div>
                ))}
                {isSending && (
                  <div className="flex justify-start animate-fadeSlideIn">
                    <div className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-es-sm">
                      <TypingDots />
                    </div>
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="mx-auto max-w-[90%] px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-center">
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                <button onClick={() => setError(null)} className="text-xs text-red-500 dark:text-red-400 underline mt-1">
                  {t("assistant.dismiss")}
                </button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Disclaimer */}
          <div className="px-4 pb-1">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center leading-tight">
              {t("assistant.disclaimer")}
            </p>
          </div>

          {/* Input */}
          <div className="px-3 pb-3 pt-1 flex-shrink-0">
            <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-1.5">
              <textarea ref={inputRef} value={input}
                onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
                onKeyDown={handleKeyDown} placeholder={t("assistant.placeholder")}
                rows={1} disabled={isSending}
                className="flex-1 resize-none bg-transparent text-sm text-[var(--foreground)] placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none px-2 py-1.5 min-h-[36px] max-h-[80px]"
                onInput={(e) => { const el = e.target as HTMLTextAreaElement; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 80) + "px"; }}
              />
              {input.length > MAX_CHARS - 200 && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 pb-1.5 flex-shrink-0">{input.length}/{MAX_CHARS}</span>
              )}
              <button onClick={() => handleSend()} disabled={!input.trim() || isSending}
                className="p-2 bg-[#0a0a0a] dark:bg-white text-white dark:text-[#0a0a0a] rounded-lg disabled:opacity-30 hover:opacity-90 transition-opacity flex-shrink-0">
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
