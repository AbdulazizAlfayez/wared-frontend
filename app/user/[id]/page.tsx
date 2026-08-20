"use client";

export const dynamic = "force-dynamic";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import {
  ArrowLeft, Loader2, MapPin, Calendar, Car, Heart, ShoppingBag, Eye, ShieldCheck,
} from "lucide-react";
import ReviewsSection from "@/components/ReviewsSection";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface UserProfile {
  id: number;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  city_name: string | null;
  member_since: string;
  role: string;
  stats: {
    total_listings: number;
    active_listings: number;
    sold_count: number;
    favorites_received: number;
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await api.get<UserProfile>(`/api/users/${id}/profile/`);
        setProfile(data);
      } catch {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 pb-12">
        <div className="max-w-2xl mx-auto px-4 text-center py-20">
          <p className="text-lg font-semibold text-slate-700 mb-4">User not found</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 bg-accent text-white rounded-xl font-medium hover:bg-accent-600 transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const isImporter = profile.role === "importer";
  const initials = (profile.name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  const memberSince = new Date(profile.member_since).toLocaleDateString("en-SA", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-accent transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
          <div className="flex items-center gap-4">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.name}
                className="w-16 h-16 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <span className="w-16 h-16 rounded-full bg-accent/10 text-accent font-bold text-xl flex items-center justify-center flex-shrink-0">
                {initials}
              </span>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">{profile.name}</h1>
                {isImporter && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-semibold">
                    <ShieldCheck className="w-3 h-3" />
                    Importer
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Member since {memberSince}
                </span>
                {profile.city_name && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {profile.city_name}
                  </span>
                )}
              </div>
            </div>
          </div>
          {profile.bio && (
            <p className="text-sm text-slate-600 mt-4 leading-relaxed">{profile.bio}</p>
          )}
        </div>

        {/* Stats — importers only */}
        {isImporter && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Total Listings", value: profile.stats.total_listings, icon: Car },
              { label: "Live Listings", value: profile.stats.active_listings, icon: Eye },
              { label: "Cars Sold", value: profile.stats.sold_count, icon: ShoppingBag },
              { label: "Favorites Received", value: profile.stats.favorites_received, icon: Heart },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
                <s.icon className="w-5 h-5 text-slate-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-slate-900">{s.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Reviews */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <ReviewsSection
            endpoint={`/api/users/${profile.id}/reviews/`}
            title="Reviews"
            emptyMessage="No reviews yet."
          />
        </div>
      </div>
    </div>
  );
}
