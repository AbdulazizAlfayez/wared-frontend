"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.post("/api/auth/password-reset/", { email });
    } catch {
      // Intentionally swallowed — never reveal whether the email exists
    } finally {
      setIsSubmitting(false);
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 pb-12 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 border border-slate-100 max-w-md w-full mx-4 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Check Your Email</h1>
          <p className="text-slate-500 mb-8">
            If an account exists for <strong className="text-slate-700">{email}</strong>, we&apos;ve sent
            password reset instructions. Check your spam folder if you don&apos;t see it.
          </p>
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-semibold transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 border border-slate-100 max-w-md w-full mx-4">
        <Link
          href="/auth/signin"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">Reset Password</h1>
        <p className="text-slate-500 mb-8">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Email Address
            </label>
            <div className="relative">
              <Mail
                className="absolute top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                style={{ insetInlineStart: "0.75rem" }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full py-3 border border-slate-200 rounded-xl text-slate-900 bg-white placeholder-slate-400 focus:border-accent focus:ring-1 focus:ring-accent"
                style={{ paddingInlineStart: "2.5rem", paddingInlineEnd: "1rem" }}
                dir="ltr"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-accent hover:bg-accent-600 disabled:bg-accent/50 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
