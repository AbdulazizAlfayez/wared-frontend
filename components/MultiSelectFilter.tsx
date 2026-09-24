"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

import { optionLabel, type FilterOption } from "@/lib/filterOptions";

/**
 * A searchable multi-select for one filter.
 *
 * The button shows what was picked rather than a count — "Toyota, Lexus +2"
 * says something, "4 selected" does not — and collapses only once naming them
 * all would wrap the row.
 */
export interface MultiSelectFilterProps {
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  language: string;
  placeholder: string;
  searchPlaceholder: string;
  emptyLabel: string;
  testId?: string;
}

const NAMED_LIMIT = 2;

export function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
  language,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  testId,
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  // Close when the click lands anywhere else; a filter panel has several of
  // these and two open at once reads as a bug.
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const labels = useMemo(
    () => new Map(options.map((option) => [option.value, optionLabel(option, language)])),
    [options, language]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter(
      (option) =>
        optionLabel(option, language).toLowerCase().includes(needle) ||
        option.value.toLowerCase().includes(needle)
    );
  }, [options, query, language]);

  const summary = useMemo(() => {
    if (!selected.length) return null;
    // Driven by `selected`, not by filtering `options`: a make whose last car
    // sold while the panel was open should still show as chosen rather than
    // vanish from the button while still filtering the results.
    const named = selected.slice(0, NAMED_LIMIT).map((value) => labels.get(value) ?? value);
    const rest = selected.length - named.length;
    return rest > 0 ? `${named.join(", ")} +${rest}` : named.join(", ");
  }, [selected, labels]);

  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((entry) => entry !== value)
        : [...selected, value]
    );
  };

  return (
    <div className="relative" ref={boxRef} data-testid={testId}>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        data-testid={testId ? `${testId}-button` : undefined}
        className="w-full flex items-center gap-2 px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-start hover:border-slate-300 focus:border-accent focus:outline-none bg-white"
      >
        <span className={`flex-1 truncate ${summary ? "text-slate-800" : "text-slate-400"}`}>
          {summary ?? placeholder}
        </span>
        {selected.length > 0 && (
          <span
            role="button"
            tabIndex={0}
            aria-label={`Clear ${label}`}
            data-testid={testId ? `${testId}-clear` : undefined}
            onClick={(event) => {
              event.stopPropagation();
              onChange([]);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.stopPropagation();
                onChange([]);
              }
            }}
            className="p-0.5 rounded hover:bg-slate-100 text-slate-400"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}
        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute z-40 mt-1 w-full bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
            <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              data-testid={testId ? `${testId}-search` : undefined}
              className="w-full text-sm focus:outline-none"
            />
          </div>
          <ul role="listbox" aria-multiselectable className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-3 text-sm text-slate-400 text-center">{emptyLabel}</li>
            )}
            {filtered.map((option) => {
              const active = selected.includes(option.value);
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => toggle(option.value)}
                    data-testid={testId ? `${testId}-option-${option.value}` : undefined}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-start hover:bg-slate-50"
                  >
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        active ? "bg-accent border-accent" : "border-slate-300"
                      }`}
                    >
                      {active && <Check className="w-3 h-3 text-white" />}
                    </span>
                    <span className="flex-1 truncate text-slate-700">
                      {optionLabel(option, language)}
                    </span>
                    <span className="text-xs text-slate-400 tabular-nums">{option.count}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
