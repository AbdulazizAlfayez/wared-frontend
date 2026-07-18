// ---------------------------------------------------------------------------
// Shared TypeScript interfaces for the Django REST Framework backend
// ---------------------------------------------------------------------------

export interface ListingImage {
  id: number;
  /** Cloudinary public_id (may be a relative path like "image/upload/...") */
  image: string;
  /** Pre-resolved full Cloudinary URL — prefer this over image */
  image_url?: string | null;
  is_primary: boolean;
  order: number;
}

export interface ListingOwner {
  id: number;
  email: string;
  name: string;
  phone: string;
  avatar_url: string | null;
}

export interface VerificationStatus {
  email_verified: boolean;
  phone_verified: boolean;
  national_id_verified: boolean;
  commercial_registration_verified: boolean;
  rega_verified: boolean;
  is_identity_verified: boolean;
  is_business_verified: boolean;
  verification_level: 'none' | 'email' | 'phone' | 'identity' | 'business' | 'full';
  pending_requests: VerificationRequest[];
}

export interface VerificationRequest {
  id: number;
  verification_type: 'national_id' | 'commercial_registration' | 'rega_license';
  document_number: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string;
  created_at: string;
  reviewed_at: string | null;
}

export interface AdminVerificationRequest extends VerificationRequest {
  user: number;
  user_email: string;
  user_name: string;
  document_file: string | null;
  document_file_url: string | null;
  reviewed_by: number | null;
  reviewed_by_email: string | null;
  notes: string;
}

export interface PublicOwnerProfile {
  id: number;
  name: string;
  avatar_url: string | null;
  bio: string;
  city_name: string | null;
  member_since: string;
  role: string;
  stats: {
    total_listings: number;
    active_listings: number;
    sold_count: number;
    favorites_received: number;
  };
  phone?: string;
  email?: string;
  subscription_badge?: "" | "basic" | "pro";
  is_identity_verified?: boolean;
  is_business_verified?: boolean;
  verification_level?: string;
}

export interface Listing {
  id: number;
  title: string;
  title_ar?: string;
  description: string | null;
  description_ar?: string;
  description_display?: string;
  make: string;
  make_ar?: string;
  make_display?: string;
  model: string;
  model_ar?: string;
  model_display?: string;
  year: number;
  price: number;
  mileage: number;
  fuel_type: string;
  transmission: string;
  body_type: string;
  color: string;
  color_ar?: string;
  color_display?: string;
  color_interior: string;
  color_interior_ar?: string;
  condition: "new" | "used" | "certified";
  city: string;
  city_ar?: string;
  city_display?: string;
  city_obj: number | null;
  region?: string;
  region_display?: string | null;
  latitude: number | null;
  longitude: number | null;
  vin: string | null;
  // Specs
  drive_type?: string;
  engine_size?: string | null;
  horsepower?: number | null;
  cylinders?: number | null;
  seats?: number | null;
  doors?: number | null;
  // Saudi-specific
  imported_from?: string;
  is_imported?: boolean;
  customs_cleared: boolean;
  accident_history: boolean;
  accident_description?: string;
  warranty_remaining?: boolean;
  service_history?: boolean;
  negotiable?: boolean;
  // Relations
  owner?: ListingOwner;        // legacy / optional
  owner_id?: number;
  showroom?: number | null;
  workshop?: number | null;
  // Phase 4.6 — Promotion fields
  is_featured?: boolean;
  is_highlighted?: boolean;
  is_top_search?: boolean;
  is_homepage?: boolean;
  promotion_priority?: number;
  promotion_expires_at?: string | null;
  is_promoted?: boolean;
  active_promotion?: ListingPromotion | null;
  // Verification
  owner_verified?: boolean;
  owner_verification_level?: string;
  // Meta
  status: "draft" | "pending" | "approved" | "rejected" | "sold";
  is_active?: boolean;
  images: ListingImage[];
  primary_image?: string | null;
  view_count?: number;
  unique_view_count?: number;
  views_count?: number;        // legacy alias
  favorites_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ---------------------------------------------------------------------------
// Imported Cars (Phase B / F)
// ---------------------------------------------------------------------------
export type ImportStatus =
  | 'available' | 'arriving' | 'reserved' | 'sold'
  | 'in_transit' | 'at_port' | 'customs_clearance' | 'delivered';

export interface ImportedListing extends Listing {
  // Source info
  source_country:    string | null;
  source_country_display?: string;
  auction_source:    string | null;
  source_price:      number | null;
  source_currency:   string | null;
  auction_grade:     string | null;
  // Cost breakdown (field names match backend serializer)
  shipping_cost:           number | null;
  /** Customs duty — backend field name is customs_duty_amount */
  customs_duty_amount:     number | null;
  /** Legacy alias — prefer customs_duty_amount */
  customs_duty?:           number | null;
  vat_amount:              number | null;
  inspection_fee:          number | null;
  transportation_cost:     number | null;
  /** Legacy fields kept for backward compatibility */
  port_fees?:              number | null;
  agent_fees?:             number | null;
  other_fees?:             number | null;
  total_landed_cost:       number | null;
  final_price_sar:         number | null;
  // Import status
  import_status:           ImportStatus | null;
  import_status_display?:  string;
  // Shipping
  port_of_origin:          string | null;
  port_of_entry:           string | null;
  shipping_company:        string | null;
  container_number:        string | null;
  bill_of_lading:          string | null;
  estimated_arrival_date:  string | null;
  actual_arrival_date:     string | null;
  // Customs
  spec_origin:             string | null;
  has_salvage_title:       boolean;
  odometer_rollback:       boolean;
  inspection_result:       string | null;
  // History
  previous_owners:         number | null;
  import_year:             number | null;
}

export interface ExchangeRate {
  currency:    string;
  rate_to_sar: string;
  updated_at:  string;
}

export interface CostEstimate {
  source_country:          string;
  car_value:               string;
  source_currency:         string;
  exchange_rate:           string;
  car_price_sar:           string;
  customs_duty_rate:       string;
  customs_duty_amount:     string;
  vat_rate:                string;
  vat_amount:              string;
  shipping_estimate_low:   string;
  shipping_estimate_high:  string;
  inspection_fee:          string;
  port_handling_fee:       string;
  transportation_estimate: string;
  total_estimate_low:      string;
  total_estimate_high:     string;
  age_restriction_warning: string | null;
  breakdown: Record<string, { label: string; amount: string }>;
}

export interface FavoriteItem {
  id: number;
  listing: Listing;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Orders (Phase F / Step 4)
// ---------------------------------------------------------------------------
export type OrderStatus =
  | 'pending' | 'deposit_requested' | 'deposit_paid' | 'confirmed'
  | 'sourcing' | 'purchased' | 'preparing_shipment'
  | 'shipped' | 'arrived_port' | 'in_customs' | 'customs_cleared'
  | 'inspection' | 'ready' | 'delivered' | 'completed'
  | 'cancelled' | 'refunded' | 'disputed';

export interface OrderListingBrief {
  id: number;
  make: string;
  model: string;
  year: number;
  source_country: string | null;
  final_price_sar: number | null;
  price: number;
  /** Resolved Cloudinary URL returned by the backend */
  primary_image: string | null;
  import_status: string | null;
  port_of_origin: string | null;
  port_of_entry: string | null;
  vessel_name: string | null;
  estimated_arrival_date: string | null;
}

export interface OrderImporterBrief {
  id: number;
  name: string;
  avatar_url: string | null;
  phone?: string;
}

export interface Order {
  id: number;
  order_number: string;
  /** Nested car listing — returned as `car` from the backend */
  car: OrderListingBrief;
  importer: OrderImporterBrief | null;
  status: OrderStatus;
  status_display: string;
  reservation_fee: number | null;
  deposit_amount: number | null;
  deposit_paid: boolean;
  total_price: number | null;
  payment_status: 'pending' | 'paid' | 'refunded';
  estimated_delivery_date: string | null;
  actual_delivery_date: string | null;
  created_at: string;
  updated_at: string;
  notes: string;
  can_cancel: boolean;
  buyer_info?: { id: number; name: string; city?: string };
  importer_info?: { id: number; name: string; business_name?: string };
  buyer_notes?: string;
}

export interface OrderTimelineEvent {
  id: number;
  /** event_type value, e.g. "shipped", "customs_cleared" */
  status: string;
  title: string;
  description: string;
  location: string | null;
  created_at: string;
  is_current: boolean;
}

export interface OrderDocument {
  id: number;
  document_type: string;
  document_type_display: string;
  title: string;
  file_url: string;
  /** ISO datetime — mapped from created_at on the backend */
  uploaded_at: string;
  created_at: string;
}

export interface BuyerDashboardStats {
  active_orders: number;
  completed_orders: number;
  favorites_count: number;
  unread_messages: number;
}

export interface AutocompleteResult {
  id: number;
  title: string;
  make: string;
  model: string;
  year: number;
}

export interface Notification {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface UnreadCount {
  count: number;
}

export interface BookingListing {
  id: number;
  title: string;
  make: string;
  model: string;
  year: number;
  city: string;
  images: ListingImage[];
}

export interface Booking {
  id: number;
  listing: BookingListing;
  preferred_date: string;
  preferred_time: string;
  message: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: number;
  listing: Listing;
  name: string;
  email: string;
  phone: string;
  message: string;
  preferred_time: string;
  source: string;
  status: "new" | "contacted" | "closed" | "spam";
  dealer_notes: string;
  created_at: string;
  updated_at: string;
}

export interface AdminStats {
  total_listings: number;
  pending_listings: number;
  approved_listings: number;
  total_users: number;
  total_leads: number;
  total_bookings: number;
  total_workshops: number;
  total_showrooms: number;
  pending_applications: number;
}

export interface ShowroomOwner {
  id: number;
  email: string;
  name: string;
}

export interface DjangoShowroom {
  id: number;
  name: string;
  city: string;
  address: string;
  lat: number | null;
  lng: number | null;
  phone: string;
  services: string[];
  rating: number;
  logo: string | null;
  cover_photo: string | null;
  owner: ShowroomOwner;
}

export interface DjangoWorkshop {
  id: number;
  name: string;
  city: string;
  address: string;
  lat: number | null;
  lng: number | null;
  phone: string;
  services: string[];
  rating: number;
  owner: ShowroomOwner | null;
}

export interface WorkshopListItem {
  id: number;
  name: string;
  name_ar: string | null;
  name_display: string;
  city: string;
  city_display: string;
  city_obj: number | null;
  is_verified: boolean;
  is_active: boolean;
  logo_url: string | null;
  average_rating: number;
  total_reviews: number;
  specializations: string[];
  services_count: number;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface UserBrief {
  id: number;
  name: string;
  email: string;
}

export interface ListingBrief {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  city: string;
  primary_image: string | null;
}

export interface Appointment {
  id: number;
  listing: ListingBrief;
  buyer: UserBrief;
  seller: UserBrief;
  appointment_date: string;
  appointment_time: string;
  end_time: string | null;
  location: string;
  notes: string;
  seller_notes: string;
  status: "pending" | "confirmed" | "rejected" | "cancelled" | "completed" | "no_show";
  cancellation_reason: string;
  created_at: string;
  updated_at: string;
}

export interface ShowroomWorkingHours {
  id?: number;
  day: number;         // 0=Sunday … 6=Saturday (integer from backend)
  day_display: string; // "Sunday", "Monday", etc. (from get_day_display)
  opening_time: string;
  closing_time: string;
  is_closed: boolean;
}

export interface ShowroomBranch {
  id: number;
  name: string;
  name_ar: string | null;
  name_display: string;
  city_obj: number | null;
  address: string;
  address_ar: string | null;
  address_display: string;
  phone: string;
  latitude: number | null;
  longitude: number | null;
  is_main: boolean;
  is_active: boolean;
  created_at: string;
}

export interface ShowroomReview {
  id: number;
  user_id: number;
  user_name: string;
  rating: number;
  title: string;
  comment: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkshopWorkingHours {
  id?: number;
  day: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  day_display?: string;
  opening_time: string;
  closing_time: string;
  is_closed: boolean;
}

export interface WorkshopService {
  id: number;
  name: string;
  name_ar: string | null;
  name_display: string;
  description: string | null;
  description_ar: string | null;
  description_display: string | null;
  category: string;
  price: string | null;
  price_type: "fixed" | "starting_from" | "contact";
  duration_minutes: number | null;
  is_active: boolean;
  order: number;
}

export interface WorkshopReview {
  id: number;
  user_id: number;
  user_name: string;
  rating: number;
  title: string;
  comment: string;
  service: number | null;
  service_name: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkshopDetail {
  id: number;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  address: string;
  address_ar: string | null;
  city: string;
  city_obj: number | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  twitter: string | null;
  snapchat: string | null;
  commercial_registration: string | null;
  is_verified: boolean;
  is_active: boolean;
  established_year: number | null;
  specializations: string[];
  average_rating: number;
  total_reviews: number;
  total_bookings: number;
  working_hours: WorkshopWorkingHours[];
  services: WorkshopService[];
  is_open_now: boolean;
  logo: string | null;
  cover_photo: string | null;
  latitude: number | null;
  longitude: number | null;
  owner_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceBooking {
  id: number;
  workshop: number;
  workshop_name: string;
  service: number | null;
  service_name: string | null;
  customer: number;
  customer_name: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_plate: string;
  booking_date: string;
  booking_time: string;
  description: string;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  estimated_cost: string | null;
  final_cost: string | null;
  notes: string;
  cancellation_reason: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  slug: string;
  description: string;
  description_ar: string;
  monthly_price: string;
  annual_price: string;
  max_listings: number;
  max_images_per_listing: number;
  max_featured_listings: number;
  features: string[];
  is_active: boolean;
  badge_type: string;
  display_order: number;
  can_bulk_upload?: boolean;
}

export interface BulkUploadRecord {
  id: number;
  file_name: string;
  status: "pending" | "processing" | "done" | "failed";
  total_rows: number;
  successful_rows: number;
  failed_rows: number;
  errors: Array<{ row: number | string; errors: string[] }>;
  created_at: string;
  completed_at: string | null;
}

export interface SubscriptionHistory {
  id: number;
  plan_name: string;
  action: string;
  old_plan_name: string | null;
  amount_paid: string;
  billing_cycle: string;
  notes: string;
  created_at: string;
}

// Phase 4.6 — Promotion types
export interface PromotionPackage {
  id: number;
  name: string;
  slug: string;
  description: string;
  promotion_type: "featured" | "highlighted" | "top_search" | "homepage";
  duration_days: number;
  price: string;
  is_active: boolean;
  display_order: number;
  priority: number;
}

export interface ListingPromotion {
  id: number;
  listing: number;
  package: PromotionPackage;
  status: "active" | "expired" | "cancelled";
  starts_at: string;
  expires_at: string;
  days_remaining: number;
  is_active_now: boolean;
  created_at: string;
}

export interface SavedSearch {
  id: number;
  name: string;
  filters: Record<string, string>;
  results_count: number;
  created_at: string;
  updated_at: string;
}

export interface RecentlyViewedItem {
  id: number;
  listing: Listing;
  viewed_at: string;
}

export interface Region {
  id: number;
  name: string;
  name_ar: string;
  cities_count: number;
}

export interface City {
  id: number;
  name: string;      // may be absent — API returns name_en
  name_en: string;   // actual API field
  name_ar: string;
  name_display?: string;
  slug?: string;
  region: number;
  region_name: string;
}

export interface Message {
  id: number;
  sender: {
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
  };
  content: string;
  is_read: boolean;
  read_at: string | null;
  is_system: boolean;
  is_mine: boolean;
  created_at: string;
}

export interface ConversationListing {
  id: number;
  make: string;
  model: string;
  year: number;
  price: string | number;
  primary_image_url: string | null;
}

export interface ConversationParty {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
}

export interface ConversationLastMessage {
  content: string;
  sender_id: number;
  is_read: boolean;
  is_system: boolean;
  created_at: string;
}

export interface Conversation {
  id: number;
  listing: ConversationListing;
  other_party: ConversationParty | null;
  last_message: ConversationLastMessage | null;
  unread_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // detail view extras
  buyer_archived?: boolean;
  seller_archived?: boolean;
  lead_id?: number | null;
}

// ---------------------------------------------------------------------------
// Phase 5.2 — Report & Moderation
// ---------------------------------------------------------------------------

export type ReportStatus   = 'pending' | 'investigating' | 'resolved' | 'dismissed';
export type ReportPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Report {
  id: number;
  report_type: string;
  reason: string;
  description: string;
  status: ReportStatus;
  priority: ReportPriority;
  action_taken: string;
  listing: { id: number; make: string; model: string; year: number; title: string } | null;
  reported_user: { id: number; email: string; name: string } | null;
  created_at: string;
}

export interface AdminReport extends Report {
  reporter: { id: number; email: string; name: string };
  reported_showroom_id: number | null;
  reported_workshop_id: number | null;
  admin_notes: string;
  evidence_url: string | null;
  resolved_by: { id: number; email: string } | null;
  resolved_at: string | null;
  updated_at: string;
}

export interface ReportStats {
  total: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
  top_reasons: { reason: string; count: number }[];
  this_week: number;
  this_month: number;
  pending_count: number;
  investigating_count: number;
}

export interface UserModerationRecord {
  id: number;
  user: number;
  user_email: string;
  action: 'warning' | 'suspension' | 'ban' | 'lifted';
  reason: string;
  related_report: number | null;
  issued_by: { id: number; email: string } | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Phase 5.3 — Reviews & Ratings
// ---------------------------------------------------------------------------

export interface ReviewReply {
  id: number;
  author_name: string;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: number;
  reviewer_name: string;
  reviewed_user: number;
  listing: number | null;
  listing_title: string | null;
  review_type: string;
  rating: number;
  title: string;
  comment: string;
  is_verified_purchase: boolean;
  status: string;
  reply: ReviewReply | null;
  can_edit: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminReview {
  id: number;
  reviewer_name: string;
  reviewed_user: number;
  reviewed_user_name: string;
  listing: number | null;
  review_type: string;
  rating: number;
  title: string;
  comment: string;
  is_verified_purchase: boolean;
  status: string;
  admin_notes: string;
  reply: ReviewReply | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewStats {
  total: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
  platform_average: number;
  this_week: number;
  this_month: number;
  pending_count: number;
  flagged_count: number;
}

// ---------------------------------------------------------------------------
// Phase 5.4 — Fraud Prevention
// ---------------------------------------------------------------------------

export interface FraudFlag {
  id: number;
  flag_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, unknown>;
  listing: number | null;
  listing_title: string | null;
  user: number | null;
  user_email: string | null;
  auto_detected: boolean;
  is_resolved: boolean;
  resolved_by: number | null;
  resolved_by_email: string | null;
  resolved_at: string | null;
  resolution_notes: string;
  created_at: string;
}

export interface FraudStats {
  total: number;
  unresolved: number;
  critical: number;
  this_week: number;
  this_month: number;
  by_type: Record<string, number>;
  by_severity: Record<string, number>;
}

export interface SuspiciousIP {
  ip_address: string;
  user_count: number;
  action_count: number;
}

export interface ListingLimitStatus {
  daily_limit: number;
  listings_today: number;
  remaining: number;
  allowed: boolean;
}

export interface ShowroomDetail {
  id: number;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  address: string;
  address_ar: string | null;
  city: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  twitter: string | null;
  snapchat: string | null;
  tiktok: string | null;
  commercial_registration: string | null;
  is_verified: boolean;
  established_year: number | null;
  specializations: string[];
  working_hours: ShowroomWorkingHours[];
  branches: ShowroomBranch[];
  is_open_now: boolean;
  listings_preview: Listing[];
  total_listings: number;
  active_listings: number;
  total_sold: number;
  average_rating: number;
  total_reviews: number;
  logo: string | null;
  cover_photo: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
}
