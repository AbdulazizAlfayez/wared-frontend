/**
 * The admin inspector payload.
 *
 * `GET /api/admin/inspect/<entity>/<id>/` answers one shape for every entity
 * (`dashboard/inspector/base.py`), so the page renders sections, signals,
 * relations and actions without knowing what it is looking at. Only the
 * `related` block differs per entity, which is why it is typed loosely here
 * and read through the narrow helpers below.
 */

export type RiskSeverity = "high" | "medium" | "low";

export interface InspectorPerson {
  id: number;
  name: string;
  email: string;
  role: string;
  entity?: string;
}

export interface InspectorField {
  key: string;
  label: string;
  value: unknown;
  /** What a human should read: the choice label, formatted money, "—". */
  display: string;
  /** True when the public API never returns this field. */
  internal: boolean;
  hint: string | null;
}

export interface InspectorSection {
  key: string;
  title: string;
  note: string | null;
  fields: InspectorField[];
}

export interface InspectorDuration {
  since: string;
  hours: number;
  phrase: string;
}

export interface InspectorRisk {
  code: string;
  severity: RiskSeverity;
  title: string;
  detail: string;
  evidence: Record<string, unknown>;
}

export interface InspectorActionField {
  field: string;
  label: string;
  type: string;
  required: boolean;
}

export interface InspectorAction {
  key: string;
  label: string;
  method: string;
  endpoint: string;
  available: boolean;
  /** Why it is blocked. Present whenever `available` is false. */
  reason: string | null;
  requires: InspectorActionField[];
  destructive: boolean;
}

export interface InspectorChange {
  field: string;
  before: unknown;
  after: unknown;
}

export interface InspectorAuditEntry {
  id: number;
  action: string;
  action_display: string;
  actor: InspectorPerson | null;
  timestamp: string;
  ip_address: string | null;
  user_agent: string | null;
  changes: InspectorChange[];
}

export interface InspectorStatus {
  value: string;
  display: string;
  since: InspectorDuration | null;
  secondary: { label: string; value: string }[];
}

export interface InspectorProvenance {
  created_at: string | null;
  created_by: InspectorPerson | null;
  submitted_at: string | null;
  approved_at: string | null;
  approved_by: InspectorPerson | null;
  status_changed_at: string | null;
  status_changed_by: InspectorPerson | null;
  time_in_status: InspectorDuration | null;
}

export interface InspectorRecord {
  entity: string;
  entity_label: string;
  id: number;
  headline: {
    title: string;
    subtitle: string | null;
    reference: string;
    image: string | null;
  };
  status: InspectorStatus | null;
  provenance: InspectorProvenance;
  risk_signals: InspectorRisk[];
  record: InspectorSection[];
  related: Record<string, unknown>;
  actions: InspectorAction[];
  audit_trail: InspectorAuditEntry[];
}

/* ── The listing inspector's relations ─────────────────────────────────────── */

export interface InspectorImporter extends InspectorPerson {
  phone: string | null;
  joined: string;
  account_age: InspectorDuration | null;
  is_active: boolean;
  is_suspended: boolean;
  suspension_reason: string | null;
  is_banned: boolean;
  warning_count: number;
  verification_level: string;
  is_identity_verified: boolean;
  is_business_verified: boolean;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  commercial_registration: string | null;
  commercial_registration_verified: boolean;
  listing_counts: Record<string, number>;
  listing_total: number;
  order_count: number;
  complaint_count: number;
  open_complaint_count: number;
  profile: {
    id: number;
    business_name: string;
    business_name_ar: string | null;
    commercial_registration: string | null;
    cr_verification_status: string;
    cr_verification_status_display: string;
    cr_issue_date: string | null;
    cr_expiry_date: string | null;
    cr_last_confirmed_date: string | null;
    cr_suspended_at: string | null;
    customs_broker_license: string | null;
    import_license_number: string | null;
    verified_at: string | null;
    years_in_business: number;
    total_cars_imported: number;
    average_rating: string | number;
    total_reviews: number;
    phone: string | null;
    email: string | null;
    city: string | null;
  } | null;
}

export interface InspectorImage {
  id: number;
  url: string | null;
  is_primary: boolean;
  order: number;
  uploaded_at: string;
}

export interface InspectorReport {
  id: number;
  reason: string;
  description: string;
  status: string;
  status_display: string;
  priority: string;
  action_taken: string | null;
  admin_notes: string | null;
  reporter: InspectorPerson | null;
  resolved_by: InspectorPerson | null;
  resolved_at: string | null;
  created_at: string;
}

export interface InspectorReservation {
  id: number;
  reservation_number: string;
  status: string;
  status_display: string;
  payment_status: string;
  platform_fee_sar: string | number;
  paid_at: string | null;
  buyer: InspectorPerson | null;
  cancellation_reason: string | null;
  converted_order: number | null;
  created_at: string;
}

export interface InspectorOrder {
  id: number;
  order_number: string;
  status: string;
  status_display: string;
  total_price: string | number | null;
  deposit_paid: boolean;
  remaining_balance: string | number | null;
  buyer: InspectorPerson | null;
  created_at: string;
}

export interface InspectorFraudFlag {
  id: number;
  flag_type: string;
  flag_type_display: string;
  severity: string;
  details: Record<string, unknown>;
  auto_detected: boolean;
  is_resolved: boolean;
  resolved_by: InspectorPerson | null;
  resolution_notes: string | null;
  created_at: string;
}

export interface InspectorPriceChange {
  field: string;
  before: unknown;
  after: unknown;
  actor: InspectorPerson | null;
  timestamp: string;
}

/** Reads one relation off the loose `related` map with a type. */
export function relation<T>(record: InspectorRecord | null, key: string): T | null {
  if (!record) return null;
  return (record.related?.[key] as T) ?? null;
}

/** Reads a list relation, always returning an array. */
export function relationList<T>(record: InspectorRecord | null, key: string): T[] {
  const value = record?.related?.[key];
  return Array.isArray(value) ? (value as T[]) : [];
}

/** Where an inspector for another entity lives. */
export function inspectorHref(entity: string, id: number | string): string {
  return `/admin/inspect/${entity}/${id}`;
}

/** The inspector endpoint for an entity. */
export function inspectorEndpoint(entity: string, id: number | string): string {
  return `/api/admin/inspect/${entity}/${id}/`;
}
