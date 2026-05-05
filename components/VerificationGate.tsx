"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth, parseApiError } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { ArrowLeft, Loader2, Mail, RotateCcw, LogOut } from "lucide-react";

const RESEND_COOLDOWN = 60;

function OtpGateScreen({ email, onSuccess, onLogout }: { email: string; onSuccess: () => void; onLogout: () => void }) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const hasSentRef = useRef(false);

  // Auto-send OTP on mount (once)
  useEffect(() => {
    if (hasSentRef.current) return;
    hasSentRef.current = true;
    api.post("/api/auth/otp/resend/", { type: "email" }).catch(() => {});
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const verify = useCallback(
    async (code: string) => {
      if (code.length < 6) return;
      setIsVerifying(true);
      setError("");
      try {
        await api.post("/api/auth/otp/verify-email/", { code });
        onSuccess();
      } catch (err) {
        setError(parseApiError(err, "Invalid code. Please try again."));
        setDigits(["", "", "", "", "", ""]);
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      } finally {
        setIsVerifying(false);
      }
    },
    [onSuccess]
  );

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const char = value.slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    if (char && index < 5) inputRefs.current[index + 1]?.focus();
    if (char && next.every((d) => d !== "")) verify(next.join(""));
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < 6; i++) next[i] = text[i] || "";
    setDigits(next);
    inputRefs.current[Math.min(text.length, 5)]?.focus();
    if (text.length === 6) verify(text);
  };

  const handleResend = async () => {
    setIsResending(true);
    setError("");
    try {
      await api.post("/api/auth/otp/resend/", { type: "email" });
      setCountdown(RESEND_COOLDOWN);
    } catch (err) {
      setError(parseApiError(err, "Failed to resend code. Please try again."));
    } finally {
      setIsResending(false);
    }
  };

  const code = digits.join("");

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-50 flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Verify Your Email</h1>
            <p className="text-slate-500 text-sm">We sent a 6-digit code to</p>
            <p className="text-slate-900 font-semibold text-sm mt-1 break-all">{email}</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          {/* OTP digit inputs */}
          <div className="flex gap-2 sm:gap-3 justify-center mb-6" onPaste={handlePaste}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                disabled={isVerifying}
                className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold border-2 rounded-xl text-slate-900
                  focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20
                  disabled:opacity-60 transition-colors
                  ${digit ? "border-accent bg-accent/5" : "border-slate-200 bg-white"}`}
                style={{ width: "2.75rem", height: "3.5rem" }}
              />
            ))}
          </div>

          {/* Verify button */}
          <button
            onClick={() => verify(code)}
            disabled={isVerifying || code.length < 6}
            className="w-full py-3 bg-accent hover:bg-accent-600 disabled:bg-accent/50 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 mb-5"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <span>Verify Email</span>
            )}
          </button>

          {/* Resend */}
          <div className="text-center mb-4">
            {countdown > 0 ? (
              <p className="text-sm text-slate-400">
                Resend code in{" "}
                <span className="font-semibold text-slate-600">{countdown}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={isResending}
                className="text-sm text-accent hover:text-accent-600 font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {isResending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                Resend Code
              </button>
            )}
          </div>

          {/* Logout */}
          <div className="text-center border-t border-slate-100 pt-4">
            <button
              onClick={onLogout}
              className="text-sm text-slate-400 hover:text-red-500 inline-flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerificationGate({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout, refreshUser } = useAuth();

  const handleSuccess = useCallback(async () => {
    await refreshUser();
  }, [refreshUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (isAuthenticated && user && !user.is_email_verified) {
    return (
      <OtpGateScreen
        email={user.email}
        onSuccess={handleSuccess}
        onLogout={logout}
      />
    );
  }

  return <>{children}</>;
}
