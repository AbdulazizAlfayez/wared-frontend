/**
 * Reserved cars, as the website sees them.
 *
 * The backend hides a reserved car from everyone except its buyer, its
 * importer and staff (`cars/visibility.py`): a non-party gets 404 from the
 * detail endpoint and never sees the row in a list. Clients get
 * `reservation_state` so they can explain themselves rather than leaving a
 * dead card or a raw API error.
 *
 * These are the same states the mobile app ships
 * (`wared-mobile/src/features/listing/unavailableListings.ts`); the website
 * mirrors them so the two clients tell a buyer the same story.
 */

/**
 * `reserved_by_you` — this viewer holds the car; offer the reservation, never
 * a second charge. `reserved` — the importer who owns it, or staff, looking at
 * a car someone else holds. `null` — on the market.
 */
export type ReservationState = null | "reserved_by_you" | "reserved";

/** The subset of a listing these rules need, from either list or detail. */
export interface ReservableListing {
  id: number;
  owner_id?: number | null;
  reservation_state?: ReservationState;
}

export interface Viewer {
  id?: number | null;
  role?: string | null;
}

/** `lib/api.ts` throws an Error carrying the HTTP status and the parsed body. */
interface ApiFailure {
  status?: number;
  detail?: unknown;
  message?: string;
}

function asFailure(error: unknown): ApiFailure | null {
  if (!error || typeof error !== "object") return null;
  return error as ApiFailure;
}

/** Every string in an error body, wherever DRF put it. */
function messagesOf(error: unknown): string {
  const failure = asFailure(error);
  if (!failure) return "";
  const parts: string[] = [];
  if (typeof failure.message === "string") parts.push(failure.message);

  const walk = (value: unknown) => {
    if (typeof value === "string") parts.push(value);
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === "object") Object.values(value).forEach(walk);
  };
  walk(failure.detail);
  return parts.join(" ");
}

/** A detail request that came back 404: gone, or hidden from this viewer. */
export function isNotFound(error: unknown): boolean {
  return asFailure(error)?.status === 404;
}

/**
 * Someone else's reservation, or one that no longer exists.
 *
 * `GET /api/reservations/{id}/` answers 403 "Not authorized." for a
 * reservation belonging to another buyer — not the 404 the listing endpoint
 * gives for a car — so checkout has to watch for both.
 */
export function isNotMine(error: unknown): boolean {
  const status = asFailure(error)?.status;
  return status === 403 || status === 404;
}

/**
 * The reserve call refusing because the car is locked.
 *
 * The contract is 409 ("This car is currently reserved."); a 400 carrying the
 * same sentence is accepted too, so the site does not depend on which backend
 * version it meets.
 */
export function isCurrentlyReserved(error: unknown): boolean {
  const failure = asFailure(error);
  if (!failure) return false;
  if (failure.status === 409) return true;
  return failure.status === 400 && /currently reserved/i.test(messagesOf(error));
}

/**
 * The refusal that means the buyer already holds this car.
 *
 * The server answers a duplicate with 400 "You already have an active
 * reservation for this car." — not a 409 — so a client that only watched for
 * 409 would show "unavailable" for the buyer's own reservation.
 */
export function isAlreadyMine(error: unknown): boolean {
  const failure = asFailure(error);
  if (!failure) return false;
  if (failure.status !== 400 && failure.status !== 409) return false;
  return /already have an active reservation|already reserved this car/i.test(messagesOf(error));
}

/**
 * True when a listing is locked by a reservation this viewer is not party to.
 *
 * The server should never send `reserved` to anyone else, so this is the
 * client refusing to show a car that slipped through a stale cache.
 */
export function isReservedForOthers(
  listing: ReservableListing | null | undefined,
  viewer: Viewer | null | undefined
): boolean {
  if (!listing || listing.reservation_state !== "reserved") return false;
  if (!viewer || viewer.id == null) return true;
  return listing.owner_id !== viewer.id && viewer.role !== "admin";
}

/** This viewer holds the car: the CTA opens the reservation instead of paying. */
export function isReservedByYou(listing: ReservableListing | null | undefined): boolean {
  return listing?.reservation_state === "reserved_by_you";
}

/** Any reservation lock at all — used to suppress the reserve path. */
export function isReserved(listing: ReservableListing | null | undefined): boolean {
  return listing?.reservation_state === "reserved_by_you" || listing?.reservation_state === "reserved";
}

/**
 * Drops cars this viewer must not be offered.
 *
 * Lists come back already filtered by the server; this catches rows a cached
 * page still holds, plus anything this session learned is gone.
 */
export function visibleListings<T extends ReservableListing>(
  listings: readonly T[] | null | undefined,
  viewer: Viewer | null | undefined,
  goneIds?: ReadonlySet<number>
): T[] {
  if (!listings) return [];
  return listings.filter(
    (listing) => !isReservedForOthers(listing, viewer) && !goneIds?.has(listing.id)
  );
}

/** Where "Browse similar cars" goes when a car is gone: same make, if known. */
export function browseSimilarHref(make?: string | null): string {
  return make ? `/browse?make=${encodeURIComponent(make)}` : "/browse";
}

/* ── Routing a buyer to the reservation they already hold ─────────────────── */

export interface MyReservation {
  id: number;
  status: string;
  /** Set once the importer accepted and the reservation became an order. */
  converted_order?: number | null;
  car?: { id: number } | null;
}

/**
 * Where "View reservation" goes.
 *
 * `/orders/{id}` is an ORDER id on this site, so a reservation that has not
 * been accepted yet cannot be linked there: an unpaid one goes back to
 * checkout to finish the SAR 99, and one awaiting the importer goes to the
 * orders list, which is where the site renders reservation cards.
 */
export function reservationHref(reservation: MyReservation | null | undefined): string {
  if (!reservation) return "/orders";
  if (reservation.converted_order) return `/orders/${reservation.converted_order}`;
  if (reservation.status === "pending_payment") return `/checkout/${reservation.id}`;
  return "/orders";
}

/** Reservation statuses that still hold a car. */
export const LIVE_RESERVATION_STATUSES = [
  "pending_payment",
  "pending_review",
  "active",
  "converted_to_order",
] as const;

export function isLiveReservation(status: string | null | undefined): boolean {
  return (LIVE_RESERVATION_STATUSES as readonly string[]).includes(status ?? "");
}

/** Picks this buyer's live reservation on a car out of their reservation list. */
export function pickReservationForCar(
  reservations: readonly MyReservation[] | null | undefined,
  carId: number
): MyReservation | null {
  if (!reservations) return null;
  return (
    reservations.find((row) => row.car?.id === carId && isLiveReservation(row.status)) ?? null
  );
}

/**
 * Tell the rest of the tab that reservations changed.
 *
 * The site has no shared cache — `useApiQuery` holds state per hook — so a
 * reserve, a cancellation or a payment is broadcast the way `lib/favorites.ts`
 * broadcasts saves, and every list or detail that cares refetches. Without it
 * a cancelled car stays missing from browse until a hard reload.
 */
export const RESERVATIONS_CHANGED_EVENT = "reservationsUpdated";

export function notifyReservationsChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(RESERVATIONS_CHANGED_EVENT));
}
