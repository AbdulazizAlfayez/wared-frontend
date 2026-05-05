const CLOUDINARY_BASE =
  process.env.NEXT_PUBLIC_CLOUDINARY_URL ||
  (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}`
    : null);

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const PLACEHOLDER = "/images/car-placeholder.jpg";

/**
 * Normalise a Django/Cloudinary image value to an absolute URL.
 *
 * Django's CloudinaryField sometimes serialises as:
 *   - full URL:   "https://res.cloudinary.com/…"
 *   - public id:  "image/upload/listings/abc123"
 *
 * Rules:
 *   1. empty / null / undefined  → placeholder
 *   2. already absolute URL      → as-is
 *   3. starts with "/"           → prepend API_BASE
 *   4. relative Cloudinary path  → prepend CLOUDINARY_BASE (if known)
 *                                   or placeholder if cloud name not configured
 */
export function getImageUrl(path: string | null | undefined): string {
  if (!path) return PLACEHOLDER;

  // Already absolute
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  // Absolute path on the same server (e.g. /media/...)
  if (path.startsWith("/")) return `${API_BASE}${path}`;

  // Relative Cloudinary public-id (e.g. "image/upload/listings/xyz")
  if (CLOUDINARY_BASE) return `${CLOUDINARY_BASE}/${path}`;

  // No cloud name configured — can't resolve Cloudinary public IDs locally.
  // Show placeholder to avoid a guaranteed 404.
  return PLACEHOLDER;
}
