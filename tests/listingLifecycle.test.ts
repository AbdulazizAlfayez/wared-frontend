import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
  canSaveDraft,
  canSubmit,
  draftPayload,
  isPubliclyVisible,
  isSubmittable,
  missingForSubmit,
  statusLabelKey,
  statusPillClass,
} from '../lib/listingLifecycle.ts';

const en = JSON.parse(readFileSync(new URL('../messages/en.json', import.meta.url), 'utf8'));
const ar = JSON.parse(readFileSync(new URL('../messages/ar.json', import.meta.url), 'utf8'));

const COMPLETE = {
  make: 'BMW',
  model: 'M5',
  year: 2024,
  mileage: 9000,
  city: 'Riyadh',
  final_price_sar: 320000,
};

/* ── drafts ──────────────────────────────────────────────────────────── */

test('a draft needs only make, model and year', () => {
  assert.equal(canSaveDraft({ make: 'BMW', model: 'M5', year: 2024 }), true);
});

test('a draft with no car in it cannot be saved', () => {
  assert.equal(canSaveDraft({}), false);
  assert.equal(canSaveDraft({ make: 'BMW', model: '', year: 2024 }), false);
});

test('a draft payload carries only what was filled in', () => {
  const payload = draftPayload({ make: 'BMW', model: 'M5', year: 2024, city: '', mileage: '' });

  assert.deepEqual(payload, { status: 'draft', make: 'BMW', model: 'M5', year: 2024 });
});

/*
 * `Number('')` is 0, and 0 km is not an empty field — it is the claim that
 * the car has never been driven.
 */
test('a blank mileage is omitted rather than sent as zero', () => {
  assert.equal('mileage' in draftPayload({ make: 'a', model: 'b', year: 1, mileage: '' }), false);
  assert.equal(draftPayload({ mileage: 0 }).mileage, 0);
});

/* ── submitting ──────────────────────────────────────────────────────── */

test('what is missing is reported in the order the form asks for it', () => {
  assert.deepEqual(missingForSubmit({}), [
    'make',
    'model',
    'year',
    'mileage',
    'city',
    'final_price_sar',
  ]);
});

test('a complete listing is missing nothing', () => {
  assert.deepEqual(missingForSubmit(COMPLETE), []);
  assert.equal(canSubmit(COMPLETE), true);
});

test('whitespace is not an answer', () => {
  assert.deepEqual(missingForSubmit({ ...COMPLETE, city: '   ' }), ['city']);
});

test('a listing may be submitted from draft, changes_requested or rejected', () => {
  for (const status of ['draft', 'changes_requested', 'rejected']) {
    assert.equal(isSubmittable(status), true, status);
  }
});

/* Submitting asks for approval; it never requires one. */
test('an approved or pending listing is not submittable', () => {
  for (const status of ['approved', 'pending', 'sold']) {
    assert.equal(isSubmittable(status), false, status);
  }
});

/* ── visibility ──────────────────────────────────────────────────────── */

test('only an approved listing is public', () => {
  assert.equal(isPubliclyVisible('approved'), true);
  for (const status of ['draft', 'pending', 'rejected', 'changes_requested']) {
    assert.equal(isPubliclyVisible(status), false, status);
  }
});

/* ── status pills ────────────────────────────────────────────────────── */

/*
 * The table used to render the raw enum for every status but one, so an
 * Arabic reader saw "Pending" and an English one saw "Approved" where the
 * catalogue says "Published".
 */
test('every status resolves to a key that both catalogues carry', () => {
  const read = (catalogue: Record<string, unknown>, path: string) =>
    path.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], catalogue);

  for (const status of ['draft', 'pending', 'approved', 'rejected', 'changes_requested', 'sold']) {
    const key = statusLabelKey(status);
    assert.equal(key, `listingStatus.${status}`);
    assert.equal(typeof read(en, key), 'string', `en missing ${key}`);
    assert.equal(typeof read(ar, key), 'string', `ar missing ${key}`);
  }
});

test('an unknown status falls back rather than rendering a raw value', () => {
  assert.equal(statusLabelKey('wat'), 'listingStatus.draft');
  assert.equal(statusLabelKey(undefined), 'listingStatus.draft');
});

test('each status has its own pill colour, with a fallback', () => {
  assert.match(statusPillClass('approved'), /green/);
  assert.match(statusPillClass('draft'), /slate/);
  assert.match(statusPillClass('nonsense'), /slate/);
});
