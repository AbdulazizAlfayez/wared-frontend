"use client";

import {
  useState, useEffect, useRef, useCallback, type KeyboardEvent,
} from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import { Loader2, X, MessageSquarePlus, Send, Bot } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatResponse {
  reply: string;
  conversation_id?: number;
}

// ---------------------------------------------------------------------------
// API helper — uses the same credentials/CSRF pattern as lib/api.ts
// ---------------------------------------------------------------------------

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[1]) : "";
}

async function chatRequest(body: Record<string, unknown>): Promise<{ data?: ChatResponse; status: number }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const csrf = getCookie("csrftoken");
  if (csrf) headers["X-CSRFToken"] = csrf;
  const lang = typeof localStorage !== "undefined" ? localStorage.getItem("lang") || "en" : "en";
  headers["Accept-Language"] = lang;

  try {
    const res = await fetch(`${BASE_URL}/api/assistant/chat/`, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify(body),
    });
    if (res.status === 429) return { status: 429 };
    if (res.status === 503) return { status: 503 };
    if (!res.ok) return { status: res.status };
    const data = await res.json();
    return { data, status: 200 };
  } catch {
    return { status: 0 };
  }
}

// ---------------------------------------------------------------------------
// Markdown-lite renderer — safe, no dangerouslySetInnerHTML
// ---------------------------------------------------------------------------

function renderAssistantText(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line && i > 0) {
      elements.push(<br key={`br-${i}`} />);
      continue;
    }
    elements.push(
      <span key={`line-${i}`}>
        {renderInline(line)}
        {i < lines.length - 1 && <br />}
      </span>
    );
  }
  return <>{elements}</>;
}

function renderInline(text: string): React.ReactNode[] {
  // Split on **bold**, [link text](url), and ##/# headings
  const parts: React.ReactNode[] = [];
  // Handle heading prefixes
  let cleaned = text;
  let isHeading = false;
  if (/^#{1,3}\s/.test(cleaned)) {
    cleaned = cleaned.replace(/^#{1,3}\s+/, "");
    isHeading = true;
  }

  // Split on bold and links
  const regex = /(\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(cleaned)) !== null) {
    if (match.index > lastIndex) {
      parts.push(cleaned.slice(lastIndex, match.index));
    }
    if (match[2]) {
      // Bold
      parts.push(<strong key={`b-${match.index}`}>{match[2]}</strong>);
    } else if (match[3] && match[4]) {
      // Link — only render internal links
      const href = match[4];
      if (href.startsWith("/")) {
        parts.push(
          <Link key={`l-${match.index}`} href={href} className="text-accent underline underline-offset-2">
            {match[3]}
          </Link>
        );
      } else {
        parts.push(match[3]);
      }
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < cleaned.length) {
    parts.push(cleaned.slice(lastIndex));
  }

  if (isHeading) {
    return [<strong key="h">{parts}</strong>];
  }
  return parts;
}

// ---------------------------------------------------------------------------
// Typing dots
// ---------------------------------------------------------------------------

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: "600ms" }}
        />
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Max chars
// ---------------------------------------------------------------------------

const MAX_CHARS = 2000;
const CID_KEY = "wared_assistant_cid";

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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevAuth = useRef(isAuthenticated);

  // Restore conversation_id from sessionStorage (auth only)
  useEffect(() => {
    if (isAuthenticated) {
      const stored = sessionStorage.getItem(CID_KEY);
      if (stored) setConversationId(Number(stored));
    }
  }, [isAuthenticated]);

  // Reset thread when auth state changes
  useEffect(() => {
    if (prevAuth.current !== isAuthenticated) {
      setMessages([]);
      setConversationId(null);
      sessionStorage.removeItem(CID_KEY);
      setError(null);
      prevAuth.current = isAuthenticated;
    }
  }, [isAuthenticated]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Esc to close on desktop
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  // New chat
  const handleNewChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    sessionStorage.removeItem(CID_KEY);
    setError(null);
  }, []);

  // Send
  const handleSend = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isSending) return;

    setInput("");
    setError(null);
    const userMsg: ChatMessage = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);

    const body: Record<string, unknown> = { message: msg };
    if (isAuthenticated) {
      if (conversationId) body.conversation_id = conversationId;
    } else {
      // Guest: send last 10 messages as history
      const allMsgs = [...messages, userMsg];
      body.history = allMsgs.slice(-10).map(({ role, content }) => ({ role, content }));
    }

    const { data, status } = await chatRequest(body);

    if (status === 429) {
      setError(t("assistant.rateLimited"));
      setIsSending(false);
      return;
    }
    if (status === 503 || status === 0) {
      setError(t("assistant.unavailable"));
      setIsSending(false);
      return;
    }
    if (!data) {
      setError(t("assistant.unavailable"));
      setIsSending(false);
      return;
    }

    setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);

    if (data.conversation_id && isAuthenticated) {
      setConversationId(data.conversation_id);
      sessionStorage.setItem(CID_KEY, String(data.conversation_id));
    }

    setIsSending(false);
  }, [input, isSending, isAuthenticated, conversationId, messages, t]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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

  return (
    <>
      {/* ── Floating button ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label={t("assistant.open")}
          className="fixed bottom-6 z-[90] w-14 h-14 rounded-full bg-[#0a0a0a] dark:bg-white text-white dark:text-[#0a0a0a] shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center group"
          style={{ insetInlineEnd: "1.5rem" }}
        >
          <Bot className="w-6 h-6" />
          <span className="absolute -top-1 -end-1 w-5 h-5 rounded-full bg-accent dark:bg-accent text-white text-[9px] font-bold flex items-center justify-center border-2 border-white dark:border-[#161B22]">
            AI
          </span>
        </button>
      )}

      {/* ── Panel ── */}
      {isOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={t("assistant.title")}
          className="fixed z-[91] flex flex-col
            bottom-0 start-0 end-0 top-0
            md:bottom-24 md:top-auto md:start-auto md:w-[380px] md:h-[560px] md:rounded-2xl
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
              <button
                onClick={handleNewChat}
                aria-label={t("assistant.newChat")}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                title={t("assistant.newChat")}
              >
                <MessageSquarePlus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                aria-label={t("common.close") || "Close"}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && !isSending ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center h-full text-center px-2">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                  <Bot className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-[var(--foreground)] mb-1">{t("assistant.greeting")}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">{t("assistant.greetingSub")}</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {quickPrompts.map((qp) => (
                    <button
                      key={qp.key}
                      onClick={() => handleSend(t(qp.key) || qp.fallback)}
                      className="px-3 py-1.5 text-xs font-medium rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                    >
                      {t(qp.key) || qp.fallback}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] px-3.5 py-2.5 text-[13px] leading-relaxed rounded-2xl ${
                        msg.role === "user"
                          ? "bg-[#0a0a0a] text-white dark:bg-white dark:text-[#0a0a0a] rounded-ee-sm"
                          : "bg-slate-100 dark:bg-slate-800 text-[var(--foreground)] rounded-es-sm"
                      }`}
                    >
                      {msg.role === "assistant" ? renderAssistantText(msg.content) : msg.content}
                    </div>
                  </div>
                ))}
                {isSending && (
                  <div className="flex justify-start">
                    <div className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-es-sm">
                      <TypingDots />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Error */}
            {error && (
              <div className="mx-auto max-w-[90%] px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-center">
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-xs text-red-500 dark:text-red-400 underline mt-1"
                >
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
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
                onKeyDown={handleKeyDown}
                placeholder={t("assistant.placeholder")}
                rows={1}
                disabled={isSending}
                className="flex-1 resize-none bg-transparent text-sm text-[var(--foreground)] placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none px-2 py-1.5 min-h-[36px] max-h-[80px]"
                onInput={(e) => {
                  const el = e.target as HTMLTextAreaElement;
                  el.style.height = "auto";
                  el.style.height = Math.min(el.scrollHeight, 80) + "px";
                }}
              />
              {input.length > MAX_CHARS - 200 && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 pb-1.5 flex-shrink-0">
                  {input.length}/{MAX_CHARS}
                </span>
              )}
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isSending}
                className="p-2 bg-[#0a0a0a] dark:bg-white text-white dark:text-[#0a0a0a] rounded-lg disabled:opacity-30 hover:opacity-90 transition-opacity flex-shrink-0"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
