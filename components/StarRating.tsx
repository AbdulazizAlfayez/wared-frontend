"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

const SIZE_MAP = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

export default function StarRating({
  rating,
  size = "md",
  interactive = false,
  onChange,
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const sizeClass = SIZE_MAP[size];

  if (interactive) {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = n <= (hovered || rating);
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange?.(n)}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              className="cursor-pointer transition-transform hover:scale-110 focus:outline-none"
              aria-label={`Rate ${n} star${n !== 1 ? "s" : ""}`}
            >
              <Star
                className={`${sizeClass} transition-colors ${
                  filled
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-slate-300"
                }`}
              />
            </button>
          );
        })}
      </div>
    );
  }

  // Display mode: support half-stars
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = rating >= n;
        const half = !filled && rating >= n - 0.5;
        return (
          <span key={n} className="relative inline-block">
            {/* Background (empty) star */}
            <Star className={`${sizeClass} text-slate-300`} />
            {/* Foreground filled/half */}
            {(filled || half) && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: half ? "50%" : "100%" }}
              >
                <Star className={`${sizeClass} fill-yellow-400 text-yellow-400`} />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
