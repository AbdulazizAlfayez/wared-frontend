"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useApiQuery } from "@/lib/hooks/use-api";
import { api } from "@/lib/api";
import type { SubscriptionPlan } from "@/lib/types";
import { CheckCircle, Loader2, X, AlertCircle, Star, Zap, Crown } from "lucide-react";

const BADGE_ICONS: Record<string, React.ElementType> = {
  basic: Zap,
  pro: Crown,
};

const PLAN_COLORS: Record<string, { bg: string; border: string; badge: string; btn: string }> = {
  free: {
    bg: "bg-white",
    border: "border-slate-200",
    badge: "bg-slate-100 text-slate-700",
    btn: "bg-slate-600 hover:bg-slate-700 text-white",
  },
  basic: {
    bg: "bg-white",
    border: "border-accent",
    badge: "bg-accent/10 text-accent",
    btn: "bg-accent hover:bg-accent-600 text-white",
  },
  pro: {
    bg: "bg-yellow-50",
    border: "border-yellow-300",
    badge: "bg-yellow-100 text-yellow-700",
    btn: "bg-yellow-400 hover:bg-yellow-500 text-slate-900",
  },
};

function ConfirmModal({
  plan,
  billing,
  onConfirm,
  onClose,
  isLoading,
  error,
}: {
  plan: SubscriptionPlan;
  billing: "monthly" | "annual";
  onConfirm: () => void;
  onClose: () => void;
  isLoading: boolean;
  error: string | null;
}) {
  const price = billing === "annual" ? plan.annual_price : plan.monthly_price;
  const isFree = parseFloat(price) === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Confirm Subscription</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 mb-4">
          <p className="text-sm text-slate-600 mb-1">Selected Plan</p>
          <p className="text-lg font-bold text-slate-900">{plan.name}</p>
          <p className="text-sm text-slate-500">{billing === "annual" ? "Annual billing" : "Monthly billing"}</p>
          <p className="text-2xl font-bold text-accent mt-2">
            {isFree ? "Free" : `SAR ${parseFloat(price).toLocaleString()}/${billing === "annual" ? "yr" : "mo"}`}
          </p>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          {isFree
            ? "You'll be subscribed to the Free plan immediately. No payment required."
            : "No payment is required at this time. This is a demo subscription system."}
        </p>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg mb-4 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-accent hover:bg-accent-600 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  const { isAuthenticated, role } = useAuth();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);
  const [successPlan, setSuccessPlan] = useState<string | null>(null);

  const { data: plans, isLoading } = useApiQuery<SubscriptionPlan[]>("/api/subscription-plans/");

  const sortedPlans = [...(plans ?? [])].sort((a, b) => a.display_order - b.display_order);

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    setIsSubscribing(true);
    setSubscribeError(null);
    try {
      await api.post("/api/my-subscription/subscribe/", {
        plan_id: selectedPlan.id,
        billing_cycle: billing,
      });
      setSuccessPlan(selectedPlan.name);
      setSelectedPlan(null);
    } catch (err: any) {
      const msg = err?.response?.detail || err?.message || "Failed to subscribe. Please try again.";
      setSubscribeError(msg);
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Simple, Transparent Pricing</h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Choose the plan that fits your business. All plans include core features — upgrade anytime.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm font-medium ${billing === "monthly" ? "text-slate-900" : "text-slate-400"}`}>
              Monthly
            </span>
            <button
              onClick={() => setBilling(billing === "monthly" ? "annual" : "monthly")}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                billing === "annual" ? "bg-accent" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  billing === "annual" ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billing === "annual" ? "text-slate-900" : "text-slate-400"}`}>
              Annual
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                Save 20%
              </span>
            </span>
          </div>
        </div>

        {/* Success banner */}
        {successPlan && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl mb-8">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-green-800 font-medium">
              Successfully subscribed to {successPlan}!{" "}
              <Link href="/dashboard/subscription" className="underline">
                View your subscription
              </Link>
            </p>
            <button onClick={() => setSuccessPlan(null)} className="ml-auto p-1 hover:bg-green-100 rounded">
              <X className="w-4 h-4 text-green-600" />
            </button>
          </div>
        )}

        {/* Plans */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sortedPlans.map((plan) => {
              const colors = PLAN_COLORS[plan.slug] ?? PLAN_COLORS.free;
              const isPro = plan.slug === "pro";
              const price = billing === "annual" ? plan.annual_price : plan.monthly_price;
              const isFree = parseFloat(price) === 0;
              const BadgeIcon = BADGE_ICONS[plan.badge_type];

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border-2 p-6 shadow-sm flex flex-col ${colors.bg} ${colors.border} ${
                    plan.slug === "basic" ? "ring-2 ring-accent ring-offset-2" : ""
                  }`}
                >
                  {plan.slug === "basic" && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">
                      Most Popular
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-4">
                    {BadgeIcon && <BadgeIcon className={`w-5 h-5 ${isPro ? "text-yellow-600" : "text-accent"}`} />}
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${colors.badge}`}>
                      {plan.name}
                    </span>
                  </div>

                  <p className="text-sm mb-4 text-slate-500">{plan.description}</p>

                  <div className="mb-6">
                    {isFree ? (
                      <p className="text-3xl font-bold text-slate-900">Free</p>
                    ) : (
                      <>
                        <p className="text-3xl font-bold text-slate-900">
                          SAR {parseFloat(price).toLocaleString()}
                        </p>
                        <p className="text-sm text-slate-500">
                          per {billing === "annual" ? "year" : "month"}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 flex-1 mb-6">
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {plan.max_listings === 0 ? "Unlimited listings" : `Up to ${plan.max_listings} listings`}
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {plan.max_images_per_listing} images per listing
                    </li>
                    {plan.max_featured_listings > 0 && (
                      <li className="flex items-center gap-2 text-sm text-slate-600">
                        <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        {plan.max_featured_listings} featured listings
                      </li>
                    )}
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {!isAuthenticated ? (
                    <Link
                      href="/auth/signin"
                      className={`block text-center py-2.5 px-4 rounded-xl font-semibold transition-colors ${colors.btn}`}
                    >
                      Get Started
                    </Link>
                  ) : role !== "dealer" && role !== "admin" ? (
                    <Link
                      href="/become-importer"
                      className={`block text-center py-2.5 px-4 rounded-xl font-semibold transition-colors ${colors.btn}`}
                    >
                      Become an Importer
                    </Link>
                  ) : (
                    <button
                      onClick={() => {
                        setSubscribeError(null);
                        setSelectedPlan(plan);
                      }}
                      className={`w-full py-2.5 px-4 rounded-xl font-semibold transition-colors ${colors.btn}`}
                    >
                      {plan.slug === "free" ? "Start Free" : "Subscribe"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* No payment note */}
        <p className="text-center text-sm text-slate-400 mt-10">
          No payment required. This is a demo subscription system — no credit card needed.
        </p>

        {/* Dealer dashboard link */}
        {(role === "dealer" || role === "admin") && (
          <div className="text-center mt-4">
            <Link href="/dashboard/subscription" className="text-accent hover:underline text-sm font-medium">
              View your current plan →
            </Link>
          </div>
        )}
      </div>

      {selectedPlan && (
        <ConfirmModal
          plan={selectedPlan}
          billing={billing}
          onConfirm={handleSubscribe}
          onClose={() => setSelectedPlan(null)}
          isLoading={isSubscribing}
          error={subscribeError}
        />
      )}
    </div>
  );
}
