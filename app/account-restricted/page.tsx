"use client";

import { useSearchParams } from "next/navigation";
import { Ban, Clock, Mail, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function RestrictedContent() {
  const params = useSearchParams();
  const type   = params.get("type") ?? "suspended";   // "banned" | "suspended"
  const reason = params.get("reason") ?? "";
  const until  = params.get("until") ?? "";

  const isBanned = type === "banned";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center space-y-6 shadow-sm">
          {/* Icon */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto border-2 ${
            isBanned
              ? "bg-red-50 border-red-200"
              : "bg-orange-50 border-orange-200"
          }`}>
            {isBanned ? (
              <Ban className="w-10 h-10 text-red-500" />
            ) : (
              <Clock className="w-10 h-10 text-orange-500" />
            )}
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isBanned ? "Account Permanently Banned" : "Account Suspended"}
            </h1>
            <p className="text-slate-500 text-sm mt-2">
              {isBanned
                ? "Your account has been permanently banned from WARED."
                : `Your account has been temporarily suspended${until ? ` until ${until}` : ""}.`}
            </p>
          </div>

          {/* Reason */}
          {reason && (
            <div className={`p-4 rounded-xl border text-left ${
              isBanned
                ? "bg-red-50 border-red-200"
                : "bg-orange-50 border-orange-200"
            }`}>
              <div className="flex items-start gap-2">
                <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isBanned ? "text-red-500" : "text-orange-500"}`} />
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isBanned ? "text-red-600" : "text-orange-600"}`}>
                    Reason
                  </p>
                  <p className="text-sm text-slate-700">{reason}</p>
                </div>
              </div>
            </div>
          )}

          {/* What you can do */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm text-slate-600 text-left space-y-2">
            {isBanned ? (
              <>
                <p className="font-medium text-slate-900">What this means:</p>
                <ul className="space-y-1 text-slate-500 list-disc list-inside">
                  <li>You cannot log in or access your account</li>
                  <li>All your listings have been removed</li>
                  <li>This action is permanent</li>
                </ul>
              </>
            ) : (
              <>
                <p className="font-medium text-slate-900">What this means:</p>
                <ul className="space-y-1 text-slate-500 list-disc list-inside">
                  <li>You cannot log in during the suspension period</li>
                  <li>Your listings remain but are hidden</li>
                  <li>Your suspension will lift automatically when it expires</li>
                </ul>
              </>
            )}
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <p className="text-sm text-slate-500">
              If you believe this {isBanned ? "ban" : "suspension"} was issued in error, please contact our support team.
            </p>
            <a
              href="mailto:support@wared.sa"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl font-medium transition-colors text-sm"
            >
              <Mail className="w-4 h-4" />
              Contact Support
            </a>
          </div>

          <Link
            href="/"
            className="block text-sm text-slate-400 hover:text-slate-700 transition-colors"
          >
            Return to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AccountRestrictedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <RestrictedContent />
    </Suspense>
  );
}
