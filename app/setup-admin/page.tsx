"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { Shield, Terminal, ExternalLink } from "lucide-react";

/**
 * Admin setup — use Django management commands or Django admin panel.
 * To promote a user to admin, run:
 *   python manage.py shell -c "from accounts.models import User; User.objects.filter(email='you@example.com').update(role='admin')"
 */
export default function SetupAdminPage() {
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
          <Shield className="w-16 h-16 text-accent mx-auto mb-6" />

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Admin Setup</h1>
          <p className="text-slate-500 mb-8">
            Admin accounts are managed via the Django backend. Use the Django admin panel or
            management commands to promote a user to admin.
          </p>

          <div className="bg-slate-50 rounded-xl p-4 text-left mb-6">
            <div className="flex items-center gap-2 text-slate-700 font-semibold mb-2 text-sm">
              <Terminal className="w-4 h-4" />
              Management Command
            </div>
            <code className="text-xs text-slate-600 break-all">
              python manage.py shell -c &quot;from accounts.models import User; User.objects.filter(email=&apos;you@example.com&apos;).update(role=&apos;admin&apos;)&quot;
            </code>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-semibold transition-colors"
            >
              <Shield className="w-5 h-5" />
              Go to Admin Dashboard
            </Link>
            <a
              href="/django-admin/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
              Django Admin Panel
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
