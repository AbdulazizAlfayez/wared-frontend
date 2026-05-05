"use client";

// Email password-reset links point to /reset-password?uid=ABC&token=XYZ
// This page is functionally identical to /auth/reset-password.

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const uid = searchParams.get("uid") || "";
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!uid || !token) {
      setError("Invalid or missing reset link. Please request a new one.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/api/auth/password-reset/confirm/", {
        uid,
        token,
        new_password: password,
        confirm_password: confirmPassword,
      });
      setSuccess(true);
      setTimeout(() => router.push("/auth/signin"), 3000);
    } catch {
      setError(
        "Reset link is invalid or has expired. Please request a new one."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-slate-900 mb-4">
          Password Reset!
        </h1>
        <p className="text-slate-500 mb-8">
          Your password has been updated. Redirecting to sign in...
        </p>
        <Link
          href="/auth/signin"
          className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-semibold transition-colors"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">
        Set New Password
      </h1>
      <p className="text-slate-500 mb-8">
        Choose a strong password for your account.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* New Password */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            New Password
          </label>
          <div className="relative">
            <Lock
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
              style={{ insetInlineStart: "0.75rem" }}
            />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="At least 8 characters"
              className="w-full py-3 border border-slate-200 rounded-xl text-slate-900 bg-white placeholder-slate-400 focus:border-accent focus:ring-1 focus:ring-accent"
              style={{ paddingInlineStart: "2.5rem", paddingInlineEnd: "3rem" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              style={{ insetInlineEnd: "0.75rem" }}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Confirm Password
          </label>
          <div className="relative">
            <Lock
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
              style={{ insetInlineStart: "0.75rem" }}
            />
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Repeat password"
              className="w-full py-3 border border-slate-200 rounded-xl text-slate-900 bg-white placeholder-slate-400 focus:border-accent focus:ring-1 focus:ring-accent"
              style={{ paddingInlineStart: "2.5rem", paddingInlineEnd: "3rem" }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              style={{ insetInlineEnd: "0.75rem" }}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}{" "}
            {error.includes("invalid or has expired") && (
              <Link
                href="/auth/forgot-password"
                className="underline font-medium"
              >
                Request a new link
              </Link>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-accent hover:bg-accent-600 disabled:bg-accent/50 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Password"
          )}
        </button>

        <p className="text-center text-sm text-slate-500">
          Remembered your password?{" "}
          <Link
            href="/auth/signin"
            className="text-accent hover:text-accent-600 font-medium"
          >
            Sign in
          </Link>
        </p>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 border border-slate-100 max-w-md w-full mx-4">
        <Suspense
          fallback={
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
