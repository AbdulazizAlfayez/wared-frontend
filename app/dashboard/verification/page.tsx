"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, ShieldX, Clock, CheckCircle, XCircle, AlertCircle, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import type { VerificationStatus, VerificationRequest } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function VerificationPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [messages, setMessages] = useState<{type: 'success'|'error', text: string}[]>([]);

  const [nationalId, setNationalId] = useState("");
  const [crNumber, setCrNumber] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  const refresh = async () => {
    const [s, r] = await Promise.all([
      api.get<VerificationStatus>("/api/verification/status/"),
      api.get<VerificationRequest[] | { results: VerificationRequest[] }>("/api/verification/requests/"),
    ]);
    setStatus(s);
    setRequests(Array.isArray(r) ? r : (r as { results: VerificationRequest[] }).results ?? []);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    refresh().catch(() => {}).finally(() => setLoading(false));
  }, [isAuthenticated]);

  const addMessage = (type: 'success'|'error', text: string) => {
    setMessages(prev => [...prev, {type, text}]);
    setTimeout(() => setMessages(prev => prev.slice(1)), 5000);
  };

  const submit = async (type: "national_id" | "commercial_registration", docNum: string) => {
    if (!docNum.trim()) return;
    setSubmitting(type);
    try {
      await api.post("/api/verification/submit/", {
        verification_type: type,
        document_number: docNum.trim(),
      });
      addMessage('success', `${type === "national_id" ? "National ID" : "Commercial Registration"} verification submitted. Under review — usually 24–48 hours.`);
      await refresh();
      if (type === "national_id") setNationalId("");
      else setCrNumber("");
    } catch (err: unknown) {
      const detail = (err as {detail?: string})?.detail ?? "Submission failed.";
      addMessage('error', typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      setSubmitting(null);
    }
  };

  // Find request for a given type
  const safeRequests = Array.isArray(requests) ? requests : [];

  const getRequest = (type: string) =>
    safeRequests.find(r => r.verification_type === type);

  const hasPending = (type: string) =>
    safeRequests.some(r => r.verification_type === type && r.status === "pending");

  const getApprovedRequest = (type: string) =>
    safeRequests.find(r => r.verification_type === type && r.status === "approved");

  const getRejectedRequest = (type: string) =>
    safeRequests.find(r => r.verification_type === type && r.status === "rejected");

  const levelColor = {
    none: "text-slate-500",
    email: "text-slate-400",
    phone: "text-slate-400",
    identity: "text-green-500",
    business: "text-blue-500",
    full: "text-amber-500",
  }[status?.verification_level ?? "none"] ?? "text-slate-500";

  const steps = [
    { key: "email", label: "Email", verified: status?.email_verified },
    { key: "phone", label: "Phone", verified: status?.phone_verified },
    { key: "identity", label: "Identity", verified: status?.national_id_verified, pending: hasPending("national_id") },
    { key: "business", label: "Business", verified: status?.commercial_registration_verified || status?.rega_verified, pending: hasPending("commercial_registration") || hasPending("rega_license") },
  ];

  if (loading || authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Verification Center</h1>
        <p className="text-slate-500 text-sm mt-1">
          Verified accounts build trust and unlock more platform features.
        </p>
      </div>

      {/* Toast messages */}
      {messages.map((m, i) => (
        <div key={i} className={`flex gap-3 p-4 rounded-xl border text-sm ${
          m.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-600'
        }`}>
          {m.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
          {m.text}
        </div>
      ))}

      {/* Current Level */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Verification Level</h2>
          <ShieldCheck className={`w-5 h-5 ${levelColor}`} />
        </div>
        {/* Steps */}
        <div className="flex items-center gap-2">
          {steps.map((step, i) => (
            <div key={step.key} className="flex items-center gap-2 flex-1">
              <div className="flex-1 flex flex-col items-center gap-1.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                  step.verified
                    ? 'border-green-500 bg-green-50'
                    : step.pending
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-slate-200 bg-slate-50'
                }`}>
                  {step.verified
                    ? <CheckCircle className="w-4 h-4 text-green-500" />
                    : step.pending
                    ? <Clock className="w-4 h-4 text-yellow-500" />
                    : <XCircle className="w-4 h-4 text-slate-600" />
                  }
                </div>
                <span className={`text-xs font-medium ${step.verified ? 'text-green-600' : step.pending ? 'text-yellow-600' : 'text-slate-400'}`}>
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <ArrowRight className="w-3 h-3 text-slate-300 flex-shrink-0 mb-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* National ID Section */}
      <VerificationSection
        title="Identity Verification"
        description="Verify your Saudi National ID (10 digits, starts with 1 or 2)."
        type="national_id"
        verified={status?.national_id_verified ?? false}
        approvedRequest={getApprovedRequest("national_id")}
        rejectedRequest={getRejectedRequest("national_id")}
        pendingRequest={hasPending("national_id") ? getRequest("national_id") : undefined}
        value={nationalId}
        onChange={setNationalId}
        onSubmit={() => submit("national_id", nationalId)}
        disabled={nationalId.length !== 10}
        submitting={submitting === "national_id"}
        placeholder="1234567890"
        maxLength={10}
        digitOnly
      />

      {/* Commercial Registration Section */}
      <VerificationSection
        title="Business Verification"
        description="Enter your Commercial Registration number to verify your business."
        type="commercial_registration"
        verified={status?.commercial_registration_verified ?? false}
        approvedRequest={getApprovedRequest("commercial_registration")}
        rejectedRequest={getRejectedRequest("commercial_registration")}
        pendingRequest={hasPending("commercial_registration") ? getRequest("commercial_registration") : undefined}
        value={crNumber}
        onChange={setCrNumber}
        onSubmit={() => submit("commercial_registration", crNumber)}
        disabled={crNumber.length < 4}
        submitting={submitting === "commercial_registration"}
        placeholder="1010XXXXXX"
      />

      {/* Request History */}
      {safeRequests.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Request History</h2>
          <div className="space-y-1">
            {safeRequests.map(req => (
              <div key={req.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <div>
                  <p className="text-slate-900 text-sm font-medium capitalize">{req.verification_type.replace(/_/g, " ")}</p>
                  <p className="text-slate-400 text-xs">{req.document_number} · {new Date(req.created_at).toLocaleDateString()}</p>
                  {req.status === "rejected" && req.rejection_reason && (
                    <p className="text-red-400 text-xs mt-0.5">Reason: {req.rejection_reason}</p>
                  )}
                </div>
                <StatusPill status={req.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const cfg = ({
    pending:  { cls: "bg-yellow-50 text-yellow-700 border-yellow-200",  label: "Pending" },
    approved: { cls: "bg-green-50  text-green-700  border-green-200",   label: "Approved" },
    rejected: { cls: "bg-red-50    text-red-700    border-red-200",     label: "Rejected" },
  } as Record<string, { cls: string; label: string }>)[status] ?? { cls: "bg-slate-100 text-slate-500 border-slate-200", label: status };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.cls}`}>{cfg.label}</span>
  );
}

interface VerificationSectionProps {
  title: string;
  description: string;
  type: string;
  verified: boolean;
  approvedRequest?: VerificationRequest;
  rejectedRequest?: VerificationRequest;
  pendingRequest?: VerificationRequest;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  submitting: boolean;
  placeholder: string;
  maxLength?: number;
  digitOnly?: boolean;
}

function VerificationSection({
  title, description, type, verified, approvedRequest, rejectedRequest, pendingRequest,
  value, onChange, onSubmit, disabled, submitting, placeholder, maxLength, digitOnly
}: VerificationSectionProps) {
  if (verified) {
    return (
      <div className="bg-white border border-green-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-50 border border-green-200 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-slate-900 font-semibold">{title}</p>
            <p className="text-green-600 text-sm">
              Verified{approvedRequest?.reviewed_at ? ` on ${new Date(approvedRequest.reviewed_at).toLocaleDateString()}` : ""}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (pendingRequest) {
    return (
      <div className="bg-white border border-yellow-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-50 border border-yellow-200 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <p className="text-slate-900 font-semibold">{title}</p>
            <p className="text-yellow-600 text-sm">
              Under review · Submitted {new Date(pendingRequest.created_at).toLocaleDateString()}
            </p>
            <p className="text-slate-400 text-xs mt-0.5">Usually takes 24–48 hours.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border rounded-2xl p-5 space-y-4 shadow-sm ${rejectedRequest ? "border-red-200" : "border-slate-100"}`}>
      <div>
        <p className="text-slate-900 font-semibold">{title}</p>
        <p className="text-slate-500 text-sm mt-0.5">{description}</p>
        {rejectedRequest && (
          <div className="mt-2 flex items-start gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
            <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Previous request rejected{rejectedRequest.rejection_reason ? `: ${rejectedRequest.rejection_reason}` : ""}. Please resubmit.</span>
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <input
          type="text"
          value={value}
          onChange={e => onChange(digitOnly ? e.target.value.replace(/\D/g,"").slice(0, maxLength ?? 20) : e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-accent focus:outline-none text-sm"
        />
        <button
          onClick={onSubmit}
          disabled={disabled || submitting}
          className="px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent/90 transition-colors whitespace-nowrap"
        >
          {submitting ? "Submitting…" : rejectedRequest ? "Resubmit" : "Submit"}
        </button>
      </div>
    </div>
  );
}
