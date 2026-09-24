/**
 * `GET /api/listings/filter-options/` — what the filter panel may offer.
 *
 * The website used to compile its own list of makes into the bundle, which
 * went stale the moment a new one was imported and offered makes no car on
 * the market had. These are the server's own facets, with the counts.
 */

export interface FilterOption {
  /** Exactly what the matching filter parameter accepts. */
  value: string;
  label_en: string;
  label_ar: string;
  count: number;
}

export interface FilterOptionMake extends FilterOption {
  models: FilterOption[];
}

export interface FilterRange {
  min: number | null;
  max: number | null;
}

export interface FilterSteppedRange extends FilterRange {
  step: number;
}

export interface ListingFilterOptions {
  makes: FilterOptionMake[];
  cities: FilterOption[];
  source_countries: FilterOption[];
  imported_from: FilterOption[];
  condition: FilterOption[];
  body_type: FilterOption[];
  transmission: FilterOption[];
  fuel_type: FilterOption[];
  drive_type: FilterOption[];
  import_status: FilterOption[];
  price: FilterSteppedRange;
  final_price_sar: FilterRange;
  year: FilterRange;
  /** Always starts at 0; `max` is rounded up to a whole step. */
  mileage: FilterSteppedRange;
}

/** The label to show, in the reader's language. */
export function optionLabel(option: FilterOption, language: string): string {
  return language.startsWith("ar") ? option.label_ar || option.label_en : option.label_en;
}

/**
 * The models to offer for the chosen makes.
 *
 * With no make chosen, every model on the market — which is how someone who
 * knows the model but not the make finds their car.
 */
export function modelsFor(
  options: ListingFilterOptions | null | undefined,
  makes: string[]
): FilterOption[] {
  if (!options) return [];
  const source = makes.length
    ? options.makes.filter((make) => makes.includes(make.value))
    : options.makes;
  const seen = new Set<string>();
  const out: FilterOption[] = [];
  for (const make of source) {
    for (const model of make.models) {
      if (seen.has(model.value)) continue;
      seen.add(model.value);
      out.push(model);
    }
  }
  return out;
}

/** Drops chosen models that belong to none of the chosen makes. */
export function pruneModels(
  options: ListingFilterOptions | null | undefined,
  makes: string[],
  models: string[]
): string[] {
  if (!makes.length || !models.length) return models;
  const allowed = new Set(modelsFor(options, makes).map((model) => model.value));
  // A make the facets have never heard of should not delete the models chosen
  // alongside it.
  if (!allowed.size) return models;
  return models.filter((model) => allowed.has(model));
}

/**
 * A filter value as the API wants it: several values become a comma list.
 *
 * Trimmed and blank-free, because a whitespace-only entry is truthy in
 * JavaScript and would travel as `?make=%20`, which the server reads as a real
 * (empty) match rather than as no filter at all.
 */
export function toParam(values: string[]): string {
  return values.map((value) => value.trim()).filter(Boolean).join(",");
}

/** Reads a comma list back out of a URL parameter. */
export function fromParam(value: string | null | undefined): string[] {
  if (!value) return [];
  return [...new Set(value.split(",").map((part) => part.trim()).filter(Boolean))];
}
