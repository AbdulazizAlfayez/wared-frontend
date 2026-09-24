/**
 * Shipment numbers, as the website reads them.
 *
 * The server refuses to mark an order 'shipped' without a number the buyer
 * can follow the car with, and says so in a body carrying both languages plus
 * a field key (`orders/serializers.py: SHIPMENT_NUMBER_REQUIRED`). These
 * helpers read that refusal and keep the copy in one place, so the importer
 * dashboard and the order page cannot disagree about what happened.
 */

/** What the form says before the server is even asked. */
export const SHIPMENT_REQUIRED_MESSAGE =
  "Shipment number is required when marking as shipped.";

interface ApiFailure {
  status?: number;
  detail?: unknown;
  message?: string;
}

function bodyOf(error: unknown): Record<string, unknown> | null {
  if (!error || typeof error !== "object") return null;
  const failure = error as ApiFailure;
  // `lib/api.ts` throws an Error whose message is the raw body, and also
  // exposes the parsed body on `detail` — read whichever is there.
  if (failure.detail && typeof failure.detail === "object") {
    return failure.detail as Record<string, unknown>;
  }
  if (typeof failure.message === "string") {
    try {
      const parsed = JSON.parse(failure.message);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * The shipment-number complaint out of a failed status update, or null when
 * the request failed for some other reason.
 *
 * Matches on the machine code rather than the sentence, so translating the
 * message later cannot quietly stop the field error from appearing.
 */
export function shipmentErrorOf(error: unknown): string | null {
  const body = bodyOf(error);
  if (!body) return null;
  if (body.code === "shipment_number_required") {
    const field = body.shipment_number;
    if (Array.isArray(field) && typeof field[0] === "string") return field[0];
    if (typeof body.detail === "string") return body.detail;
    return SHIPMENT_REQUIRED_MESSAGE;
  }
  // A plain DRF field error, in case the server ever stops hand-building it.
  const field = body.shipment_number;
  if (Array.isArray(field) && typeof field[0] === "string") return field[0];
  return null;
}

/** Whether an order has a shipment worth showing. */
export function hasShipment(order: {
  shipment_number?: string | null;
  carrier?: string | null;
}): boolean {
  return Boolean(order.shipment_number && order.shipment_number.trim());
}

/** "Maersk · MSKU1234567", or just the number when no carrier was recorded. */
export function shipmentSummary(order: {
  shipment_number?: string | null;
  carrier?: string | null;
}): string {
  const number = (order.shipment_number ?? "").trim();
  const carrier = (order.carrier ?? "").trim();
  if (!number) return "";
  return carrier ? `${carrier} · ${number}` : number;
}
