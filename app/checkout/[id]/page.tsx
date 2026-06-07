"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useApiQuery } from "@/lib/hooks/use-api";
import { api } from "@/lib/api";
import Link from "next/link";
import {
  ArrowLeft, Lock, CheckCircle, Loader2, CreditCard,
  Shield, Clock, ChevronRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ReservationDetail {
  id: number;
  reservation_number: string;
  car: {
    id: number;
    make: string;
    model: string;
    year: number;
    price: number;
    final_price_sar: number | null;
    primary_image: string | null;
    import_status: string;
    source_country: string | null;
  };
  status: string;
  platform_fee_sar: number;
  payment_status: string;
  importer_name?: string;
}

const METHODS = [
  { id: "mada", label: "Mada", desc: "Debit card", icon: "💳" },
  { id: "visa", label: "Visa / Mastercard", desc: "Credit or debit", icon: "💳" },
  { id: "apple_pay", label: "Apple Pay", desc: "Quick checkout", icon: "" },
  { id: "stc_pay", label: "STC Pay", desc: "Mobile payment", icon: "📱" },
] as const;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = params.id as string;

  const { data: reservation, isLoading } = useApiQuery<ReservationDetail>(
    `/api/reservations/${reservationId}/`,
    { enabled: !!reservationId }
  );

  const [method, setMethod] = useState("mada");
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handlePay = async () => {
    if (!reservation) return;
    setIsPaying(true);
    setError("");

    try {
      const result = await api.post<{ success: boolean; error?: string }>(
        `/api/reservations/${reservation.id}/pay/`,
        { method }
      );

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/reservations`);
        }, 2000);
      } else {
        setError(result.error || "Payment failed. Please try again.");
      }
    } catch (err: any) {
      let msg = "Payment failed. Please try again.";
      try {
        const body = typeof err?.message === "string" ? JSON.parse(err.message) : err;
        msg = body.error || body.detail || msg;
      } catch { /* use default */ }
      setError(msg);
    } finally {
      setIsPaying(false);
    }
  };

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // Not found
  if (!reservation) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] pt-24 pb-12">
        <div className="max-w-lg mx-auto px-4 text-center py-20">
          <p className="text-slate-500 mb-4">Reservation not found.</p>
          <Link href="/browse" className="text-sm text-[#0B1424] font-medium underline">Back to browse</Link>
        </div>
      </div>
    );
  }

  // Already paid
  if (reservation.payment_status === "succeeded" || success) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] pt-24 pb-12">
        <div className="max-w-lg mx-auto px-4 text-center py-20">
          <div className="w-16 h-16 bg-[#E8F5F0] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-[#0B8470]" />
          </div>
          <h1 className="text-2xl font-bold text-[#0B1424] mb-2">Reservation confirmed</h1>
          <p className="text-slate-500 mb-6">
            Your SAR {reservation.platform_fee_sar} holding fee has been paid. The importer will be notified.
          </p>
          <Link
            href="/reservations"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0B1424] text-white rounded-xl font-medium text-sm"
          >
            View my reservations <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const car = reservation.car;
  const fee = reservation.platform_fee_sar;
  const finalPrice = car.final_price_sar ?? car.price;

  return (
    <div className="min-h-screen bg-[#FAFAF8] pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Back link */}
        <Link href={`/car/${car.id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0B1424] mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to listing
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* ── Left: Payment form (3 cols) ── */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-[#0B1424]/8 p-6 sm:p-8">
              <h1 className="text-2xl font-bold text-[#0B1424] mb-1">Reserve your car</h1>
              <p className="text-sm text-slate-500 mb-8">
                Pay the SAR {fee} holding fee to secure this vehicle. Fully refundable until the car is purchased.
              </p>

              {/* Payment methods */}
              <div className="mb-8">
                <p className="text-sm font-medium text-[#0B1424] mb-3">Payment method</p>
                <div className="space-y-2">
                  {METHODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMethod(m.id)}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all text-left ${
                        method === m.id
                          ? "border-[#0B1424] bg-[#0B1424]/[0.03]"
                          : "border-[#0B1424]/10 hover:border-[#0B1424]/20"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        method === m.id ? "border-[#0B1424]" : "border-slate-300"
                      }`}>
                        {method === m.id && <div className="w-2.5 h-2.5 rounded-full bg-[#0B1424]" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#0B1424]">{m.label}</p>
                        <p className="text-xs text-slate-400">{m.desc}</p>
                      </div>
                      <span className="text-lg">{m.icon}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Card form (only for card methods) */}
              {(method === "mada" || method === "visa") && (
                <div className="mb-8 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Card number</label>
                    <input
                      type="text"
                      placeholder="•••• •••• •••• ••••"
                      className="w-full px-4 py-3 border border-[#0B1424]/10 rounded-xl text-sm text-[#0B1424] placeholder-slate-300 focus:border-[#0B1424] focus:ring-1 focus:ring-[#0B1424]/20 focus:outline-none"
                      disabled={isPaying}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Expiry</label>
                      <input
                        type="text"
                        placeholder="MM / YY"
                        className="w-full px-4 py-3 border border-[#0B1424]/10 rounded-xl text-sm text-[#0B1424] placeholder-slate-300 focus:border-[#0B1424] focus:ring-1 focus:ring-[#0B1424]/20 focus:outline-none"
                        disabled={isPaying}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">CVV</label>
                      <input
                        type="text"
                        placeholder="•••"
                        className="w-full px-4 py-3 border border-[#0B1424]/10 rounded-xl text-sm text-[#0B1424] placeholder-slate-300 focus:border-[#0B1424] focus:ring-1 focus:ring-[#0B1424]/20 focus:outline-none"
                        disabled={isPaying}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Name on card</label>
                    <input
                      type="text"
                      placeholder="Full name as shown on card"
                      className="w-full px-4 py-3 border border-[#0B1424]/10 rounded-xl text-sm text-[#0B1424] placeholder-slate-300 focus:border-[#0B1424] focus:ring-1 focus:ring-[#0B1424]/20 focus:outline-none"
                      disabled={isPaying}
                    />
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Pay button */}
              <button
                onClick={handlePay}
                disabled={isPaying}
                className="w-full py-3.5 bg-[#0B1424] hover:bg-black disabled:opacity-50 text-white rounded-xl font-medium text-[15px] transition-colors flex items-center justify-center gap-2"
              >
                {isPaying ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : (
                  <>Pay SAR {fee} <ChevronRight className="w-4 h-4" /></>
                )}
              </button>

              <p className="text-xs text-slate-400 text-center mt-4 flex items-center justify-center gap-1.5">
                <Lock className="w-3 h-3" /> Secured with end-to-end encryption
              </p>
            </div>
          </div>

          {/* ── Right: Order summary (2 cols) ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-[#0B1424]/8 p-6 sticky top-28">
              <p className="text-sm font-medium text-[#0B1424] mb-4">Order summary</p>

              {/* Car thumbnail */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-16 h-12 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                  {car.primary_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={car.primary_image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-slate-300" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#0B1424]">{car.year} {car.make} {car.model}</p>
                  {reservation.importer_name && (
                    <p className="text-xs text-slate-400">{reservation.importer_name}</p>
                  )}
                </div>
              </div>

              {/* Fee breakdown */}
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Holding fee</span>
                  <span className="font-medium text-[#0B1424]">SAR {fee}</span>
                </div>
                <div className="h-px bg-[#0B1424]/8" />
                <div className="flex justify-between font-semibold">
                  <span className="text-[#0B1424]">Total today</span>
                  <span className="text-[#0B1424]">SAR {fee}</span>
                </div>
              </div>

              {/* Remaining balance */}
              <div className="mt-4 pt-4 border-t border-[#0B1424]/8">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Remaining balance</span>
                  <span className="text-slate-500">SAR {(finalPrice - fee).toLocaleString()}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Paid on delivery</p>
              </div>

              {/* Trust badges */}
              <div className="mt-6 space-y-2.5">
                {[
                  { icon: Shield, text: "Fully refundable until car is purchased" },
                  { icon: Lock, text: "Held in secure escrow" },
                  { icon: CheckCircle, text: "SAR 99 deducted from final price" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-2">
                    <Icon className="w-4 h-4 text-[#0B8470] flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-500">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
