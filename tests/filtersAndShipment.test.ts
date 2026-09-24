import test from "node:test";
import assert from "node:assert/strict";

import {
  fromParam,
  modelsFor,
  optionLabel,
  pruneModels,
  toParam,
  type ListingFilterOptions,
} from "../lib/filterOptions.ts";
import {
  hasShipment,
  shipmentErrorOf,
  shipmentSummary,
  SHIPMENT_REQUIRED_MESSAGE,
} from "../lib/shipment.ts";
import { partyProfileHref } from "../lib/profiles.ts";

/* ── filter options ───────────────────────────────────────────────────────── */

function option(value: string, label: string, count = 1) {
  return { value, label_en: label, label_ar: `${label}-ar`, count };
}

const OPTIONS = {
  makes: [
    { ...option("toyota", "Toyota", 3), models: [option("camry", "Camry"), option("hilux", "Hilux")] },
    { ...option("lexus", "Lexus", 2), models: [option("lx", "LX")] },
  ],
  cities: [option("riyadh", "Riyadh", 4)],
  source_countries: [],
  imported_from: [],
  condition: [],
  body_type: [],
  transmission: [],
  fuel_type: [],
  drive_type: [],
  import_status: [],
  price: { min: 50000, max: 900000, step: 5000 },
  final_price_sar: { min: null, max: null },
  year: { min: 2020, max: 2024 },
  mileage: { min: 0, max: 150000, step: 5000 },
} as unknown as ListingFilterOptions;

test("a comma list round-trips through the URL", () => {
  assert.equal(toParam(["toyota", "lexus"]), "toyota,lexus");
  assert.deepEqual(fromParam("toyota,lexus"), ["toyota", "lexus"]);
});

test("blank and duplicate values never reach the server", () => {
  // `?make=` is an empty icontains match to the server, not "no filter".
  assert.equal(toParam(["", "  "]), "");
  assert.deepEqual(fromParam("toyota, toyota , "), ["toyota"]);
});

test("no chosen make offers every model on the market", () => {
  assert.deepEqual(
    modelsFor(OPTIONS, []).map((model) => model.value),
    ["camry", "hilux", "lx"]
  );
});

test("choosing a make narrows the models to that make", () => {
  assert.deepEqual(
    modelsFor(OPTIONS, ["lexus"]).map((model) => model.value),
    ["lx"]
  );
});

test("dropping a make drops the models only it offered", () => {
  assert.deepEqual(pruneModels(OPTIONS, ["toyota"], ["camry", "lx"]), ["camry"]);
});

test("a make the facets have never heard of does not delete the models with it", () => {
  // A stale shared link naming a sold-out make must not silently empty itself.
  assert.deepEqual(pruneModels(OPTIONS, ["geely"], ["camry"]), ["camry"]);
});

test("labels follow the reader's language", () => {
  assert.equal(optionLabel(option("toyota", "Toyota"), "en"), "Toyota");
  assert.equal(optionLabel(option("toyota", "Toyota"), "ar"), "Toyota-ar");
});

/* ── shipment numbers ─────────────────────────────────────────────────────── */

test("the server's refusal is recognised by its code, not its wording", () => {
  const error = {
    detail: {
      code: "shipment_number_required",
      detail: "Shipment number is required when marking as shipped.",
      detail_ar: "رقم الشحنة مطلوب عند تحديد الحالة كمشحونة.",
      shipment_number: ["Shipment number is required when marking as shipped."],
    },
  };
  assert.equal(shipmentErrorOf(error), SHIPMENT_REQUIRED_MESSAGE);
});

test("the refusal is read out of a raw JSON error message too", () => {
  const error = new Error(
    JSON.stringify({ code: "shipment_number_required", shipment_number: ["Required."] })
  );
  assert.equal(shipmentErrorOf(error), "Required.");
});

test("an unrelated failure is not mistaken for a missing shipment number", () => {
  assert.equal(shipmentErrorOf(new Error("Network request failed")), null);
  assert.equal(shipmentErrorOf({ detail: { detail: "Balance payment not confirmed." } }), null);
});

test("a plain DRF field error still lands on the field", () => {
  assert.equal(
    shipmentErrorOf({ detail: { shipment_number: ["Too long."] } }),
    "Too long."
  );
});

test("an order has a shipment only once it carries a number", () => {
  assert.equal(hasShipment({ shipment_number: "", carrier: "Maersk" }), false);
  assert.equal(hasShipment({ shipment_number: "  " }), false);
  assert.equal(hasShipment({ shipment_number: "MSKU1" }), true);
});

test("the summary names the carrier when there is one", () => {
  assert.equal(shipmentSummary({ shipment_number: "MSKU1", carrier: "Maersk" }), "Maersk · MSKU1");
  assert.equal(shipmentSummary({ shipment_number: "MSKU1" }), "MSKU1");
  assert.equal(shipmentSummary({ shipment_number: "" }), "");
});

/* ── which profile a name opens ───────────────────────────────────────────── */

test("an importer opens their importer page, keyed by the PROFILE id", () => {
  // /api/importers/{pk}/ is keyed by ImporterProfile, not by the user — the
  // two differ, and using the wrong one opens somebody else or a 404.
  assert.equal(
    partyProfileHref({ id: 91, role: "importer", profile_url_id: 16 }),
    "/importers/16"
  );
});

test("an importer with no profile falls back to their public user page", () => {
  assert.equal(partyProfileHref({ id: 91, role: "importer" }), "/user/91");
});

test("a buyer opens the buyer page", () => {
  assert.equal(partyProfileHref({ id: 42, role: "user", profile_url_id: 42 }), "/buyer/42");
});

test("a party with no role stated is treated as a buyer", () => {
  assert.equal(partyProfileHref({ id: 42 }), "/buyer/42");
});
