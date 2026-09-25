import test from "node:test";
import assert from "node:assert/strict";

import { hasImage, imageUrl } from "../lib/images.ts";

const URL = "https://res.cloudinary.com/demo/image/upload/v1/listings/abc";

/**
 * `primary_image` has meant three things in this API: a bare URL, a
 * `{thumb, card}` dict, and null. A page that read a key off it crashed on the
 * shape it did not expect, so nothing reads it directly any more.
 */

test("sizes a bare Cloudinary URL", () => {
  assert.match(imageUrl(URL, "card")!, /w_640,h_480/);
  assert.match(imageUrl(URL, "thumb")!, /w_160,h_120/);
  assert.match(imageUrl(URL, "full")!, /w_1600/);
});

test("reads the variant object the server sends now", () => {
  const variants = { thumb: `${URL}#t`, card: `${URL}#c`, full: `${URL}#f` };
  assert.equal(imageUrl(variants, "card"), `${URL}#c`);
  assert.equal(imageUrl(variants, "thumb"), `${URL}#t`);
});

test("falls back to another variant rather than to nothing", () => {
  assert.match(imageUrl({ thumb: `${URL}#t`, card: null, full: null }, "card")!, /#t/);
});

test("reads a listing, a nested car and an images array", () => {
  assert.match(imageUrl({ primary_image: URL }, "card")!, /w_640/);
  assert.match(imageUrl({ primary_image_url: URL }, "thumb")!, /w_160/);
  assert.match(imageUrl({ car: { primary_image: URL } }, "card")!, /w_640/);
  assert.match(
    imageUrl({ images: [{ image_url: `${URL}#a` }, { image_url: `${URL}#b`, is_primary: true }] })!,
    /#b/
  );
});

test("answers null for everything that has no photo", () => {
  for (const input of [null, undefined, "", "   ", {}, { primary_image: null }, 42, [], true]) {
    assert.equal(imageUrl(input, "card"), null, `expected null for ${JSON.stringify(input)}`);
    assert.equal(hasImage(input), false);
  }
});

test("a whitespace-only value never becomes an img src", () => {
  // Truthy in JavaScript, and <img src="   "> is a broken image with no
  // placeholder behind it.
  assert.equal(imageUrl("   ", "card"), null);
});

test("cannot be made to throw", () => {
  const cycle: Record<string, unknown> = {};
  cycle.car = cycle;
  const hostile = {
    get primary_image(): never {
      throw new Error("no");
    },
  };
  assert.doesNotThrow(() => imageUrl(cycle));
  assert.doesNotThrow(() => imageUrl(hostile));
  assert.equal(imageUrl(cycle), null);
  assert.equal(imageUrl(hostile), null);
});

test("leaves a non-Cloudinary URL alone", () => {
  const plain = "https://images.unsplash.com/photo-123?w=1400";
  assert.equal(imageUrl(plain, "card"), plain);
});
