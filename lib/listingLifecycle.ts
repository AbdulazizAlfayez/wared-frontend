/**
 * Where a listing is in its life, and what it still needs to move on.
 *
 * The rule, which the backend owns and this mirrors:
 *
 *   draft → submit → pending → (admin) approved → publicly visible
 *
 * A draft is private and silent: it notifies nobody and never enters the
 * review queue. Submitting requires no prior approval of any kind — approval
 * is what it asks for, and approval gates public visibility and nothing else.
 *
 * Pure functions, deliberately: the site's test runner cannot render React,
 * so anything worth asserting has to live outside a component.
 */

export type ListingStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'changes_requested'
  | 'sold';

/** Mirrors `ListingSerializer.REQUIRED_FOR_SUBMIT`, in the same order. */
export const REQUIRED_FOR_SUBMIT = [
  'make',
  'model',
  'year',
  'mileage',
  'city',
  'final_price_sar',
] as const;

/** The three a draft cannot do without. Mirrors `DRAFT_REQUIRED_FIELDS`. */
export const DRAFT_REQUIRED = ['make', 'model', 'year'] as const;

/**
 * Mirrors `SUBMITTABLE_STATUSES` server-side.
 *
 * `draft` has never been in the queue; the other two were, and came back with
 * something to fix.
 */
export const SUBMITTABLE: ReadonlySet<string> = new Set([
  'draft',
  'changes_requested',
  'rejected',
]);

export function isSubmittable(status: string | null | undefined): boolean {
  return SUBMITTABLE.has(String(status ?? ''));
}

/** Approval is the only thing that puts a listing in front of a buyer. */
export function isPubliclyVisible(status: string | null | undefined): boolean {
  return status === 'approved';
}

type FormValues = Record<string, unknown>;

function isBlank(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (typeof value === 'number') return Number.isNaN(value);
  return false;
}

/** What a form still has to collect before the listing may be submitted. */
export function missingForSubmit(values: FormValues): string[] {
  return REQUIRED_FOR_SUBMIT.filter((field) => isBlank(values[field]));
}

/** Whether "Save draft" may be pressed. */
export function canSaveDraft(values: FormValues): boolean {
  return DRAFT_REQUIRED.every((field) => !isBlank(values[field]));
}

export function canSubmit(values: FormValues): boolean {
  return missingForSubmit(values).length === 0;
}

/**
 * The payload for a draft save: only what has actually been filled in.
 *
 * Blank strings are dropped rather than sent. A `""` on a decimal field is a
 * 400, and `Number('')` is 0 — a mileage of 0 is not an empty field, it is
 * the claim that the car has never been driven.
 */
export function draftPayload(values: FormValues): Record<string, unknown> {
  const payload: Record<string, unknown> = { status: 'draft' };
  for (const [key, value] of Object.entries(values)) {
    if (!isBlank(value)) payload[key] = value;
  }
  return payload;
}

/**
 * The i18n key for a status pill.
 *
 * Every status goes through this. The listings table used to render the raw
 * enum for all but one of them, so an Arabic reader was shown "Pending" and
 * an English one "Approved" where the catalogue says "Published".
 */
export function statusLabelKey(status: string | null | undefined): string {
  const known: readonly string[] = [
    'draft',
    'pending',
    'approved',
    'rejected',
    'changes_requested',
    'sold',
  ];
  const value = String(status ?? '');
  return known.includes(value) ? `listingStatus.${value}` : 'listingStatus.draft';
}

export const STATUS_PILL_CLASSES: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
  changes_requested: 'bg-orange-100 text-orange-700',
  sold: 'bg-slate-200 text-slate-700',
  draft: 'bg-slate-100 text-slate-600',
};

export function statusPillClass(status: string | null | undefined): string {
  return STATUS_PILL_CLASSES[String(status ?? '')] ?? 'bg-slate-100 text-slate-600';
}

/**
 * The reviewer's note, as it reaches the person who has to act on it.
 *
 * `owner_feedback` is the field to read. `request-changes` writes the note to
 * `admin_notes`, which the serializer strips for everyone who is not an admin
 * — so reading that directly returned nothing for the owner it was written
 * for. `rejection_reason` stays as a fallback for older rows.
 */
export interface ReviewNote {
  text: string;
  /** ISO timestamp, when the server sent one. */
  at: string | null;
}

export function reviewNote(listing: {
  status?: string | null;
  owner_feedback?: string | null;
  rejection_reason?: string | null;
  feedback_at?: string | null;
}): ReviewNote | null {
  if (!needsOwnerFix(listing.status)) return null;
  const text = listing.owner_feedback?.trim() || listing.rejection_reason?.trim();
  if (!text) return null;
  return { text, at: listing.feedback_at ?? null };
}

/** The states where the owner is the one who has to do something next. */
export function needsOwnerFix(status: string | null | undefined): boolean {
  return status === 'rejected' || status === 'changes_requested';
}
