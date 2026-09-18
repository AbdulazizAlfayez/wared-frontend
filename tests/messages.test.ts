import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * English and Arabic are kept in step by hand — there is no framework doing
 * it — so a key added to one and forgotten in the other renders as the raw
 * dotted path (`lib/i18n.tsx` returns the key when a lookup misses).
 */
type Messages = Record<string, unknown>;

function leafKeys(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return [prefix];
  return Object.entries(value as Messages).flatMap(([key, child]) =>
    leafKeys(child, prefix ? `${prefix}.${key}` : key)
  );
}

const en = JSON.parse(readFileSync(new URL("../messages/en.json", import.meta.url), "utf8"));
const ar = JSON.parse(readFileSync(new URL("../messages/ar.json", import.meta.url), "utf8"));

test("every English key exists in Arabic, and vice versa", () => {
  const enKeys = new Set(leafKeys(en));
  const arKeys = new Set(leafKeys(ar));

  assert.deepEqual(
    [...enKeys].filter((k) => !arKeys.has(k)).sort(),
    [],
    "keys missing from ar.json"
  );
  assert.deepEqual(
    [...arKeys].filter((k) => !enKeys.has(k)).sort(),
    [],
    "keys missing from en.json"
  );
});

test("no message is left empty", () => {
  for (const [name, catalogue] of [
    ["en", en],
    ["ar", ar],
  ] as const) {
    for (const key of leafKeys(catalogue)) {
      const value = key
        .split(".")
        .reduce<unknown>((acc, part) => (acc as Messages)?.[part], catalogue);
      assert.equal(typeof value, "string", `${name}: ${key} is not a string`);
      assert.notEqual((value as string).trim(), "", `${name}: ${key} is empty`);
    }
  }
});

test("the reserved-car copy is translated, not copied from English", () => {
  const enAvailability = (en as Messages).availability as Record<string, string>;
  const arAvailability = (ar as Messages).availability as Record<string, string>;

  assert.equal(arAvailability.viewReservation, "عرض الحجز");
  assert.equal(arAvailability.reserved, "محجوزة");
  assert.equal(arAvailability.title, "هذه السيارة لم تعد متاحة");
  assert.equal(arAvailability.body, "تم حجزها أو بيعها.");
  assert.equal(arAvailability.browseSimilar, "تصفّح سيارات مشابهة");
  assert.equal(arAvailability.row, "لم تعد متاحة");

  for (const key of Object.keys(enAvailability)) {
    assert.notEqual(arAvailability[key], enAvailability[key], `ar.availability.${key} is English`);
  }
});
