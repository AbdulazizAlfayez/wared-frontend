"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useApiQuery } from "@/lib/hooks/use-api";
import type { VerificationStatus } from "@/lib/types";
import { api } from "@/lib/api";
import {
  LayoutDashboard, Car, Loader2,
  MessageSquare, ShieldCheck, Star,
  Package, Plus, ClipboardList,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Sidebar link
// ---------------------------------------------------------------------------

function SidebarLink({
  href,
  label,
  icon: Icon,
  exact,
  showDot,
  count,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  showDot?: boolean;
  count?: number;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? "bg-accent text-white"
          : "text-slate-700 hover:text-accent hover:bg-accent/5"
      }`}
    >
      <span className="relative flex-shrink-0">
        <Icon className="w-5 h-5" />
        {showDot && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-500 rounded-full" />
        )}
      </span>
      {label}
      {count != null && count > 0 && (
        <span className={`ml-auto text-xs font-bold rounded-full px-2 py-0.5 ${
          isActive ? "bg-white/20 text-white" : "bg-accent/10 text-accent"
        }`}>
          {count}
        </span>
      )}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, role } = useAuth();
  const router = useRouter();

  const isImporterOrAdmin = isAuthenticated && (role === "importer" || role === "admin");
  const isDashboardUser   = isImporterOrAdmin;

  // Fetch verification status for the dot indicator
  const [verifLevel, setVerifLevel] = useState<string | null>(null);
  useEffect(() => {
    if (!isAuthenticated) return;
    api.get<VerificationStatus>("/api/verification/status/")
      .then(s => setVerifLevel(s.verification_level))
      .catch(() => {});
  }, [isAuthenticated]);

  const verifIncomplete = verifLevel !== null && ['none', 'email', 'phone'].includes(verifLevel);

  // Fetch pending reservation count for importers
  const { data: pendingResData } = useApiQuery<{ count: number }>(
    "/api/reservations/pending-for-me/",
    { enabled: isImporterOrAdmin }
  );
  const pendingResCount = pendingResData?.count ?? 0;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/auth/signin");
    } else if (!isLoading && isAuthenticated && !isDashboardUser) {
      router.replace("/dashboard/buyer");
    }
  }, [isLoading, isAuthenticated, isDashboardUser, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAuthenticated || !isDashboardUser) {
    return null;
  }

  // Build dynamic nav based on role
  const importerNavItems = [
    { href: "/dashboard/importer",               label: "Overview",       icon: LayoutDashboard, exact: true },
    { href: "/dashboard/importer/reservations",  label: "Reservations",   icon: Package, count: pendingResCount || undefined },
    { href: "/dashboard/listings",               label: "My Listings",    icon: Car },
    { href: "/dashboard/importer/list-car",      label: "List New Car",   icon: Plus },
    { href: "/dashboard/importer/orders",        label: "Orders",         icon: ClipboardList },
    { href: "/messages",                         label: "Messages",       icon: MessageSquare },
    { href: "/dashboard/verification",           label: "Verification",   icon: ShieldCheck, showDot: verifIncomplete },
    { href: "/dashboard/reviews",                label: "My Reviews",     icon: Star },
  ];

  // NOTE: the old dealer-marketplace nav was removed as dead code — WARED's
  // dashboard is importer-only (navItems below was always importerNavItems).
  // Showroom/workshop/leads/analytics pages still exist and remain reachable
  // by their direct URLs.

  const navItems = importerNavItems;
  const dashboardTitle = "Importer Dashboard";

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-60 flex-shrink-0 hidden md:block">
            <div className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm sticky top-28">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-2">
                {dashboardTitle}
              </p>
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <SidebarLink key={item.href} {...item} />
                ))}
              </nav>
            </div>
          </aside>

          {/* Mobile nav tabs */}
          <div className="md:hidden w-full mb-4">
            <div className="bg-white rounded-xl border border-slate-100 p-2 flex gap-1 overflow-x-auto shadow-sm">
              {navItems.map((item) => (
                <SidebarLink key={item.href} {...item} />
              ))}
            </div>
          </div>

          {/* Main content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
