import { api } from "./api";
import { pickReservationForCar, type MyReservation } from "./reservations";

interface ReservationListResponse {
  results?: MyReservation[];
}

/**
 * The buyer's own reservation on a car, or null.
 *
 * The listing payload says *that* a car is reserved by you but never which
 * reservation it is (no id on any cars serializer), and the reservations list
 * has no `?car=` filter — so the row is matched client-side. Used to send a
 * holder to their reservation instead of offering the SAR 99 charge again.
 */
export async function findMyReservationForCar(carId: number): Promise<MyReservation | null> {
  try {
    const data = await api.get<ReservationListResponse | MyReservation[]>(
      "/api/reservations/list/?status=all"
    );
    const rows = Array.isArray(data) ? data : (data?.results ?? []);
    const match = pickReservationForCar(rows, carId);
    if (!match) return null;

    /*
     * `converted_order` — the order id an accepted reservation became — is on
     * the detail serializer only; the list omits it. Without this second call
     * an accepted reservation would fall back to the orders list instead of
     * opening its own order.
     */
    if (match.status === "converted_to_order" && !match.converted_order) {
      try {
        const detail = await api.get<MyReservation>(`/api/reservations/${match.id}/`);
        return { ...match, converted_order: detail?.converted_order ?? null };
      } catch {
        return match;
      }
    }
    return match;
  } catch {
    // Not fatal: the caller falls back to the orders list.
    return null;
  }
}
