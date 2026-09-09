"use client";

import { Star, TrendingUp, Home, Zap } from "lucide-react";
import type { Listing } from "@/lib/types";

interface Props {
  listing: Listing;
  className?: string;
}

const BADGE: Record<string, { label: string; Icon: React.ElementType; cls: string }> = {
  is_top_search: { label: "Top Search", Icon: TrendingUp, cls: "bg-purple-600 text-white" },
  is_homepage:   { label: "Homepage",   Icon: Home,        cls: "bg-green-600 text-white"  },
  is_featured:   { label: "Featured",   Icon: Star,        cls: "bg-amber-500 text-white"  },
  is_highlighted:{ label: "Promoted",   Icon: Zap,         cls: "bg-orange-500 text-white" },
};

const PRIORITY = ["is_top_search", "is_homepage", "is_featured", "is_highlighted"] as const;

export default function PromotionBadge({ listing, className = "" }: Props) {
  const key = PRIORITY.find((k) => listing[k as keyof Listing]);
  if (!key) return null;
  const { label, Icon, cls } = BADGE[key];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cls} ${className}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}
