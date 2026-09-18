import test from "node:test";
import assert from "node:assert/strict";

import {
  browseSimilarHref,
  isAlreadyMine,
  isCurrentlyReserved,
  isNotFound,
  isReserved,
  isReservedByYou,
  isReservedForOthers,
  pickReservationForCar,
  reservationHref,
  visibleListings,
} from "../lib/reservations.ts";

/** What `lib/api.ts` throws: an Error carrying the status and the parsed body. */
function apiError(status: number, detail: unknown) {
  const err = new Error(typeof detail === "string" ? detail : JSON.stringify(detail)) as Error & {
    status: number;
    detail: unknown;
  };
  err.status = status;
  err.detail = detail;
  return err;
}

test("a 404 means gone, or hidden from this viewer", () => {
  assert.equal(isNotFound(apiError(404, { detail: "Not found." })), true);
  assert.equal(isNotFound(apiError(500, { detail: "Server error" })), false);
  assert.equal(isNotFound(new Error("network")), false);
  assert.equal(isNotFound(null), false);
});

test("409 is someone else holding the car", () => {
  // The live shape: POST /api/reservations/ for a car another buyer holds.
  const conflict = apiError(409, { detail: "This car is currently reserved.", language: "en" });
  assert.equal(isCurrentlyReserved(conflict), true);
  assert.equal(isAlreadyMine(conflict), false);
});

test("the duplicate refusal is a 400, and it means the car is already yours", () => {
  // The backend checks the per-buyer case FIRST, so a buyer who already holds
  // the car never sees the 409 — watching only for 409 would send them to the
  // unavailable page instead of to their own reservation.
  const duplicate = apiError(400, {
    non_field_errors: ["You already have an active reservation for this car."],
  });
  assert.equal(isAlreadyMine(duplicate), true);
  assert.equal(isCurrentlyReserved(duplicate), false);
});

test("a 400 carrying the conflict sentence still counts as reserved", () => {
  const legacy = apiError(400, { detail: "This car is currently reserved." });
  assert.equal(isCurrentlyReserved(legacy), true);
});

test("other refusals are neither", () => {
  const ownListing = apiError(400, {
    non_field_errors: ["You cannot reserve your own listing."],
  });
  assert.equal(isCurrentlyReserved(ownListing), false);
  assert.equal(isAlreadyMine(ownListing), false);
});

test("reserved_by_you is the buyer holding the car", () => {
  assert.equal(isReservedByYou({ id: 1, reservation_state: "reserved_by_you" }), true);
  assert.equal(isReservedByYou({ id: 1, reservation_state: "reserved" }), false);
  assert.equal(isReserved({ id: 1, reservation_state: "reserved" }), true);
  assert.equal(isReserved({ id: 1, reservation_state: null }), false);
});

test("`reserved` belongs to the importer who owns the car, or staff", () => {
  const car = { id: 5, owner_id: 73, reservation_state: "reserved" as const };

  assert.equal(isReservedForOthers(car, { id: 73, role: "importer" }), false, "the owner");
  assert.equal(isReservedForOthers(car, { id: 2, role: "admin" }), false, "staff");
  assert.equal(isReservedForOthers(car, { id: 2, role: "user" }), true, "another buyer");
  assert.equal(isReservedForOthers(car, null), true, "a guest");
});

test("a car with no lock is never treated as reserved", () => {
  const car = { id: 5, owner_id: 73, reservation_state: null };
  assert.equal(isReservedForOthers(car, { id: 2, role: "user" }), false);
  assert.equal(isReservedForOthers(null, { id: 2, role: "user" }), false);
});

test("lists drop cars this viewer must not be offered", () => {
  const rows = [
    { id: 1, owner_id: 73, reservation_state: null },
    { id: 2, owner_id: 73, reservation_state: "reserved" as const },
    { id: 3, owner_id: 73, reservation_state: "reserved_by_you" as const },
  ];
  const viewer = { id: 9, role: "user" };

  assert.deepEqual(
    visibleListings(rows, viewer).map((r) => r.id),
    [1, 3],
    "someone else's lock goes; your own stays"
  );
  assert.deepEqual(
    visibleListings(rows, viewer, new Set([1])).map((r) => r.id),
    [3],
    "ids this session learned are gone go too"
  );
  assert.deepEqual(visibleListings(null, viewer), []);
});

test("View reservation routes by what the reservation has become", () => {
  assert.equal(
    reservationHref({ id: 41, status: "converted_to_order", converted_order: 12 }),
    "/orders/12",
    "accepted: the order page"
  );
  assert.equal(
    reservationHref({ id: 41, status: "pending_payment" }),
    "/checkout/41",
    "unpaid: back to the SAR 99"
  );
  assert.equal(
    reservationHref({ id: 41, status: "pending_review" }),
    "/orders",
    "awaiting the importer: the orders list renders reservation cards"
  );
  assert.equal(reservationHref(null), "/orders");
});

test("the buyer's live reservation on a car is found by car id", () => {
  const rows = [
    { id: 1, status: "cancelled_by_buyer", car: { id: 159 } },
    { id: 2, status: "pending_review", car: { id: 159 } },
    { id: 3, status: "pending_review", car: { id: 205 } },
  ];
  assert.equal(pickReservationForCar(rows, 159)?.id, 2, "a dead reservation does not count");
  assert.equal(pickReservationForCar(rows, 999), null);
  assert.equal(pickReservationForCar(null, 159), null);
});

test("Browse similar keeps the make when it is known", () => {
  assert.equal(browseSimilarHref("Toyota"), "/browse?make=Toyota");
  assert.equal(browseSimilarHref("Mercedes-Benz"), "/browse?make=Mercedes-Benz");
  assert.equal(browseSimilarHref(null), "/browse");
});
