/**
 * Reading a listing's photo, whatever shape it arrived in.
 *
 * `primary_image` has meant three different things in this API: a bare
 * Cloudinary URL from the detail endpoints, a `{thumb, card}` dict from the
 * list, and `null` for a car with no photos. The server now sends
 * `{thumb, card, full}` or null everywhere
 * (`cars/utils/cloudinary_urls.py: primary_image_payload`), but a cached
 * response can outlive a deploy and an older server can still answer — so
 * nothing reads a key off the field directly.
 *
 * `imageUrl` never throws. The worst case is null, which every caller already
 * handles by drawing its own placeholder.
 */

/*
 * Deliberately dependency-free, like the other directly-tested modules in this
 * folder: `node --test` runs them as plain ESM, where a relative import needs
 * a `.ts` extension that `tsc` then rejects. The two constants below are the
 * same ones `lib/utils.ts: getImageUrl` reads — the resolution rule for a bare
 * Cloudinary public id, and nothing else from that module.
 */
const CLOUDINARY_BASE =
  process.env.NEXT_PUBLIC_CLOUDINARY_URL ||
  (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}`
    : null);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/** A stored value that is not a URL: a public id, or a server-relative path. */
function absolute(value: string): string | null {
  if (value.startsWith("/")) return `${API_BASE}${value}`;
  return CLOUDINARY_BASE ? `${CLOUDINARY_BASE}/${value}` : null;
}

const TRANSFORMS = {
  thumb: "w_160,h_120,c_fill,f_auto,q_auto",
  card: "w_640,h_480,c_fill,f_auto,q_auto",
  full: "w_1600,c_limit,f_auto,q_auto",
} as const;

export type ImageSize = keyof typeof TRANSFORMS;

/** The `{thumb, card, full}` block the server sends. All keys may be null. */
export interface ImageVariants {
  thumb?: string | null;
  card?: string | null;
  full?: string | null;
}

export type PrimaryImageField = ImageVariants | string | null | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sized(url: string | null | undefined, size: ImageSize): string | null {
  // A whitespace-only value is truthy in JavaScript and would travel on as an
  // <img src="   "> — a broken image with no placeholder behind it.
  const trimmed = url?.trim();
  if (!trimmed) return null;
  if (!trimmed.includes("/upload/")) {
    // Not a Cloudinary delivery URL: an absolute URL passes through, anything
    // else is a stored public id or path that has to be resolved first. Null
    // when there is no cloud configured, since a guaranteed 404 is worse than
    // the caller's own placeholder.
    return trimmed.startsWith("http") ? trimmed : absolute(trimmed);
  }
  return trimmed.replace("/upload/", `/upload/${TRANSFORMS[size]}/`);
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

function resolve(input: unknown, size: ImageSize, depth = 0): string | null {
  if (input == null || depth > 3) return null;
  if (typeof input === "string") return sized(input, size);
  if (!isRecord(input)) return null;

  // A variants object. The requested size first, then anything else present:
  // a card drawn from a thumb is soft, which still beats an empty rectangle.
  const variant = firstString(input[size], input.card, input.thumb, input.full);
  if (variant) return input[size] === variant ? variant : sized(variant, size);

  const nested =
    input.primary_image ??
    input.primary_image_url ??
    input.image_url ??
    input.image ??
    input.url ??
    null;
  if (nested != null) return resolve(nested, size, depth + 1);

  if (isRecord(input.car)) return resolve(input.car, size, depth + 1);
  if (isRecord(input.listing)) return resolve(input.listing, size, depth + 1);
  if (Array.isArray(input.images) && input.images.length) {
    const primary =
      input.images.find((row) => isRecord(row) && row.is_primary) ?? input.images[0];
    return resolve(primary, size, depth + 1);
  }
  return null;
}

/**
 * The URL to put in `src`, or null when this car has no photo.
 *
 * Accepts a listing, a nested car, a variants object or a bare URL, because
 * every one of those is what some page actually holds.
 */
export function imageUrl(input: unknown, size: ImageSize = "card"): string | null {
  try {
    return resolve(input, size);
  } catch {
    // A photo is never worth taking a page down for.
    return null;
  }
}

/** True when there is a photo to show. */
export function hasImage(input: unknown): boolean {
  return imageUrl(input, "card") !== null;
}
