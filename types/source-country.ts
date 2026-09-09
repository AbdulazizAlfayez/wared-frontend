export interface SourceCountry {
  code: string;
  name_en: string;
  name_ar: string;
  iso_code: string;
  flag_emoji: string;
  latitude: string;
  longitude: string;
  description?: string;
  description_ar?: string;
  avg_shipping_cost_sar: string;
  avg_shipping_days: number;
  display_order: number;
}

export interface CountryAggregate extends SourceCountry {
  total_cars: number;
  available_cars: number;
  arriving_soon_cars: number;
  reserved_cars: number;
  avg_price_sar: string | null;
  min_price_sar: string | null;
  max_price_sar: string | null;
  popular_makes: string[];
}

export interface ByCountryResponse {
  countries: CountryAggregate[];
  total_countries: number;
  total_cars_globally: number;
  last_updated: string;
}
