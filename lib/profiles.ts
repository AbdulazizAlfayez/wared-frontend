/**
 * Where a person's profile lives.
 *
 * Two different pages, keyed by two different ids, which is the whole reason
 * the server sends `profile_url_id` alongside `id`:
 *
 *   - an importer's page is `/importers/{ImporterProfile.pk}` — NOT their user
 *     id, and the two differ, so linking with the wrong one lands on another
 *     importer or a 404;
 *   - a buyer's page is `/buyer/{user id}`, served by an endpoint only their
 *     importer and staff may read.
 */

export interface ProfileParty {
  id: number;
  role?: string | null;
  profile_url_id?: number | null;
}

export function partyProfileHref(party: ProfileParty): string {
  if (party.role === "importer" || party.role === "admin") {
    // Without a profile id there is no importer page to open; their public
    // user profile is the honest fallback.
    return party.profile_url_id
      ? `/importers/${party.profile_url_id}`
      : `/user/${party.id}`;
  }
  return `/buyer/${party.profile_url_id ?? party.id}`;
}
