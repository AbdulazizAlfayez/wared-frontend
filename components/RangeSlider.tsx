"use client";

import { useId } from "react";

/**
 * A two-handle range slider.
 *
 * Built from two native `<input type="range">` elements stacked on one track
 * rather than from pointer maths on a div. That is deliberate: a native range
 * input is focusable, arrow-key operable and announced correctly by a screen
 * reader — `role="slider"` with a live value — none of which a div gets for
 * free, and all of which someone filtering a car catalogue with a keyboard
 * needs.
 *
 * The handles cannot cross: each end clamps against the other, so the pair is
 * always ordered no matter which is dragged.
 */
export interface RangeSliderProps {
  /** The full extent: [low, high]. */
  bound: [number, number];
  value: [number, number];
  step: number;
  onChange: (next: [number, number]) => void;
  /** Already translated — "Mileage (km)". */
  label: string;
  /** What each end reads as, e.g. "85,000 km". */
  format: (value: number) => string;
  /** Shown instead of the range when both handles sit at the ends. */
  anyLabel: string;
  testId?: string;
}

export function RangeSlider({
  bound,
  value,
  step,
  onChange,
  label,
  format,
  anyLabel,
  testId,
}: RangeSliderProps) {
  const id = useId();
  const [low, high] = bound;
  const span = high - low || 1;
  const [min, max] = value;
  const isFull = min <= low && max >= high;

  const pct = (n: number) => ((n - low) / span) * 100;

  return (
    <div data-testid={testId}>
      <div className="flex items-baseline justify-between mb-2">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {label}
        </label>
        <span
          className="text-xs text-slate-500 tabular-nums"
          data-testid={testId ? `${testId}-readout` : undefined}
        >
          {isFull ? anyLabel : `${format(min)} — ${format(max)}`}
        </span>
      </div>

      <div className="relative h-9 flex items-center">
        {/* The track, and the part of it the selection covers. */}
        <div className="absolute inset-x-0 h-1 rounded-full bg-slate-200" />
        <div
          className="absolute h-1 rounded-full bg-accent"
          style={{ left: `${pct(min)}%`, right: `${100 - pct(max)}%` }}
        />

        {/*
          Both inputs span the full track and sit on top of each other. Pointer
          events are disabled on the track itself and re-enabled on the thumbs,
          so each handle stays grabbable along the whole bar rather than only
          on its own half.
        */}
        <input
          type="range"
          id={`${id}-min`}
          min={low}
          max={high}
          step={step}
          value={min}
          aria-label={`${label} — minimum`}
          aria-valuetext={format(min)}
          data-testid={testId ? `${testId}-min` : undefined}
          onChange={(e) => {
            const next = Math.min(Number(e.target.value), max);
            onChange([next, max]);
          }}
          className="range-thumb absolute w-full appearance-none bg-transparent pointer-events-none"
        />
        <input
          type="range"
          id={`${id}-max`}
          min={low}
          max={high}
          step={step}
          value={max}
          aria-label={`${label} — maximum`}
          aria-valuetext={format(max)}
          data-testid={testId ? `${testId}-max` : undefined}
          onChange={(e) => {
            const next = Math.max(Number(e.target.value), min);
            onChange([min, next]);
          }}
          className="range-thumb absolute w-full appearance-none bg-transparent pointer-events-none"
        />
      </div>

      <div className="flex justify-between text-[11px] text-slate-400 tabular-nums">
        <span>{format(low)}</span>
        <span>{format(high)}</span>
      </div>

      <style jsx>{`
        .range-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          pointer-events: auto;
          height: 18px;
          width: 18px;
          border-radius: 9999px;
          background: #ffffff;
          border: 2px solid #0a0a0a;
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
        }
        .range-thumb::-moz-range-thumb {
          pointer-events: auto;
          height: 18px;
          width: 18px;
          border-radius: 9999px;
          background: #ffffff;
          border: 2px solid #0a0a0a;
          cursor: pointer;
        }
        .range-thumb:focus-visible::-webkit-slider-thumb {
          outline: 2px solid #0a0a0a;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
