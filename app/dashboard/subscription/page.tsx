"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useApiQuery } from "@/lib/hooks/use-api";
import { api } from "@/lib/api";
import type { DealerSubscription, SubscriptionHistory, SubscriptionPlan } from "@/lib/types";
import {
  CreditCard, CheckCircle, AlertCircle, Loader2, X, TrendingUp,
  Calendar, Crown, Zap, ArrowUpRight, Clock, RotateCcw,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    expired: "bg-red-100 text-red-700",
    cancelled: "bg-slate-100 text-slate-600",
    past_due: "bg-amber-100 text-amber-700",
    trial: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${map[status] ?? "bg-slate-100 text-slate-600"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function UsageBar({ label, used, max }: { label: string; used: number; max: number }) {
  const unlimited = max === 0;
  const pct = unlimited ? 0 : Math.min((used / max) * 100, 100);
  const color = pct > 80 ? "bg-red-500" : pct > 60 ? "bg-amber-500" : "bg-green-500";

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-slate-700">{label}</span>
        <span className="text-sm font-medium text-slate-900">
          {used} / {unlimited ? "∞" : max}
        </span>
      </div>
      {!unlimited && (
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
        </div>
      )}
      {unlimited && (
        <div className="h-2 bg-green-100 rounded-full overflow-hidden">
          <div className="h-full w-full bg-green-400 rounded-full" />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Upgrade Modal
// ---------------------------------------------------------------------------

function UpgradeModal({
  plans,
  current,
  onClose,
  onSubscribe,
  isLoading,
  error,
}: {
  plans: SubscriptionPlan[];
  current: DealerSubscription;
  onClose: () => void;
  onSubscribe: (slug: string, billing: "monthly" | "annual") => void;
  isLoading: boolean;
  error: string | null;
}) {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [picked, setPicked] = useState<string | null>(null);

  const sorted = [...plans].sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Upgrade Plan</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center gap-3 mb-6">
          <span className={`text-sm ${billing === "monthly" ? "text-slate-900 font-medium" : "text-slate-400"}`}>Monthly</span>
          <button
            onClick={() => setBilling(billing === "monthly" ? "annual" : "monthly")}
            className={`relative w-10 h-5 rounded-full transition-colors ${billing === "annual" ? "bg-accent" : "bg-slate-300"}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${billing === "annual" ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
          <span className={`text-sm ${billing === "annual" ? "text-slate-900 font-medium" : "text-slate-400"}`}>
            Annual <span className="text-xs text-green-600 font-semibold">(Save 20%)</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {sorted.map((plan) => {
            const price = billing === "annual" ? plan.annual_price : plan.monthly_price;
            const isCurrent = plan.id === current.plan.id;
            const isSelected = picked === plan.slug;

            return (
              <button
                key={plan.id}
                onClick={() => !isCurrent && setPicked(plan.slug)}
                disabled={isCurrent}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  isCurrent
                    ? "border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed"
                    : isSelected
                    ? "border-accent bg-accent/5"
                    : "border-slate-200 hover:border-accent/50"
                }`}
              >
                <p className="font-bold text-slate-900 mb-1">{plan.name}</p>
                {isCurrent && <span className="text-xs text-slate-500">Current</span>}
                <p className="text-lg font-bold text-accent mt-1">
                  {parseFloat(price) === 0 ? "Free" : `SAR ${parseFloat(price).toLocaleString()}`}
                </p>
                <p className="text-xs text-slate-500">/{billing === "annual" ? "yr" : "mo"}</p>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg mb-4 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <p className="text-xs text-slate-400 mb-4">No payment required. Demo system only.</p>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">
            Cancel
          </button>
          <button
            onClick={() => picked && onSubscribe(picked, billing)}
            disabled={!picked || isLoading}
            className="flex-1 px-4 py-2.5 bg-accent hover:bg-accent-600 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Confirm Upgrade
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function SubscriptionPage() {
  const { data: subscription, isLoading, refetch } = useApiQuery<DealerSubscription>("/api/my-subscription/");
  const { data: history, refetch: historyRefetch } = useApiQuery<SubscriptionHistory[]>("/api/my-subscription/history/");
  const { data: allPlans } = useApiQuery<SubscriptionPlan[]>("/api/subscription-plans/");

  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isActing, setIsActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [pendingPlanSlug, setPendingPlanSlug] = useState<string | null>(null);
  const [pendingPlanName, setPendingPlanName] = useState<string | null>(null);
  const [pendingBillingCycle, setPendingBillingCycle] = useState<string | null>(null);

  useEffect(() => {
    setPendingPlanSlug(localStorage.getItem("pending_plan_slug"));
    setPendingPlanName(localStorage.getItem("pending_plan_name"));
    setPendingBillingCycle(localStorage.getItem("pending_billing_cycle"));
  }, []);

  const dismissPendingBanner = () => {
    localStorage.removeItem("pending_plan_slug");
    localStorage.removeItem("pending_plan_name");
    localStorage.removeItem("pending_billing_cycle");
    setPendingPlanSlug(null);
    setPendingPlanName(null);
    setPendingBillingCycle(null);
  };

  const { data: dealerStats } = useApiQuery<{ approved_listings: number }>(
    "/api/dashboard/dealer/"
  );

  const showSuccess = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubscribe = async (slug: string, billing: "monthly" | "annual") => {
    setIsActing(true);
    setActionError(null);
    try {
      const planObj = allPlans?.find((p) => p.slug === slug);
      if (!planObj) throw new Error("Plan not found");
      await api.post("/api/my-subscription/subscribe/", { plan_id: planObj.id, billing_cycle: billing });
      setShowUpgrade(false);
      dismissPendingBanner();
      refetch();
      historyRefetch();
      showSuccess("Plan updated successfully!");
    } catch (err: any) {
      setActionError(err?.message || "Failed to update plan.");
    } finally {
      setIsActing(false);
    }
  };

  const handleCancel = async () => {
    setIsActing(true);
    setActionError(null);
    try {
      await api.post("/api/my-subscription/cancel/", {});
      setShowCancelConfirm(false);
      refetch();
      historyRefetch();
      showSuccess("Subscription cancelled.");
    } catch (err: any) {
      setActionError(err?.message || "Failed to cancel subscription.");
    } finally {
      setIsActing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="text-center py-20">
        <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 mb-4">No active subscription found.</p>
        <Link href="/pricing" className="px-6 py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent-600 transition-colors">
          View Plans
        </Link>
      </div>
    );
  }

  const plan = subscription.plan;
  const activeListings = dealerStats?.approved_listings ?? 0;
  const isPro = plan.slug === "pro";

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 bg-green-500 text-white rounded-xl shadow-lg">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{toast}</span>
          <button onClick={() => setToast(null)} className="p-1 hover:bg-white/20 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <h1 className="text-2xl font-bold text-slate-900">My Subscription</h1>

      {/* Pending plan banner */}
      {pendingPlanSlug && plan.slug === "free" && (
        <div className="flex items-start justify-between gap-4 p-4 bg-accent/5 border border-accent/30 rounded-2xl">
          <div className="flex items-start gap-3">
            <Crown className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-900">
                You selected the <span className="text-accent">{pendingPlanName ?? pendingPlanSlug}</span> plan during signup
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Activate it now to unlock more listings
                {pendingBillingCycle ? ` with ${pendingBillingCycle} billing` : ""}.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => { setActionError(null); setShowUpgrade(true); }}
              className="px-3 py-1.5 bg-accent hover:bg-accent-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Upgrade now
            </button>
            <button
              onClick={dismissPendingBanner}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Current Plan Card */}
      <div className={`rounded-2xl border-2 p-6 ${isPro ? "bg-yellow-50 border-yellow-200" : "bg-white border-slate-200"}`}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {plan.badge_type === "pro" && <Crown className="w-5 h-5 text-yellow-600" />}
              {plan.badge_type === "basic" && <Zap className="w-5 h-5 text-accent" />}
              <h2 className="text-xl font-bold text-slate-900">{plan.name} Plan</h2>
              <StatusBadge status={subscription.status} />
            </div>
            <p className="text-sm text-slate-500 mb-1">
              Billing: {subscription.billing_cycle === "annual" ? "Annual" : "Monthly"}
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Calendar className="w-4 h-4" />
              <span>
                {subscription.is_expired
                  ? "Expired"
                  : `Renews ${formatDate(subscription.expires_at)}`}
                {!subscription.is_expired && ` · ${subscription.days_remaining} days remaining`}
              </span>
            </div>
            {subscription.is_trial && (
              <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                <Clock className="w-4 h-4" />
                <span>Trial period active</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => { setActionError(null); setShowUpgrade(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-600 text-white rounded-xl font-medium text-sm transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" />
              Upgrade Plan
            </button>
            {subscription.status === "active" && plan.slug !== "free" && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-medium text-sm transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Usage Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          Usage
        </h2>
        <div className="space-y-4">
          <UsageBar
            label="Active Listings"
            used={activeListings}
            max={plan.max_listings}
          />
          {plan.max_featured_listings > 0 && (
            <UsageBar label="Featured Listings" used={0} max={plan.max_featured_listings} />
          )}
        </div>

        {plan.max_listings > 0 && activeListings >= plan.max_listings && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Listing limit reached</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Upgrade your plan to add more listings.{" "}
                <button onClick={() => setShowUpgrade(true)} className="underline font-semibold">
                  Upgrade now
                </button>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Plan Features */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Plan Features</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <li className="flex items-center gap-2 text-sm text-slate-700">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            {plan.max_listings === 0 ? "Unlimited listings" : `Up to ${plan.max_listings} listings`}
          </li>
          <li className="flex items-center gap-2 text-sm text-slate-700">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            {plan.max_images_per_listing} images per listing
          </li>
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <Link href="/pricing" className="text-accent hover:underline text-sm font-medium flex items-center gap-1">
            Compare all plans <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Subscription History */}
      {(history ?? []).length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-accent" />
            Subscription History
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 text-slate-500 font-medium">Date</th>
                  <th className="text-left py-2 text-slate-500 font-medium">Action</th>
                  <th className="text-left py-2 text-slate-500 font-medium">Plan</th>
                  <th className="text-left py-2 text-slate-500 font-medium">Billing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(history ?? []).map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50">
                    <td className="py-2.5 text-slate-600 whitespace-nowrap">{formatDate(h.created_at)}</td>
                    <td className="py-2.5">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 capitalize">
                        {h.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-900 font-medium">{h.plan_name}</td>
                    <td className="py-2.5 text-slate-600 capitalize">{h.billing_cycle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cancel confirm */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCancelConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Cancel Subscription?</h2>
            <p className="text-sm text-slate-500 mb-4">
              Your subscription will remain active until {formatDate(subscription.expires_at)}, then you&apos;ll be downgraded to the Free plan.
            </p>
            {actionError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg mb-4 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium"
              >
                Keep Plan
              </button>
              <button
                onClick={handleCancel}
                disabled={isActing}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isActing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade modal */}
      {showUpgrade && allPlans && (
        <UpgradeModal
          plans={allPlans}
          current={subscription}
          onClose={() => setShowUpgrade(false)}
          onSubscribe={handleSubscribe}
          isLoading={isActing}
          error={actionError}
        />
      )}
    </div>
  );
}
