import Link from "next/link";
import {
  Search, Calculator, CreditCard, MapPin,
  ArrowRight, ChevronDown, Globe, Shield, Clock, Star, Truck,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------
const STEPS = [
  {
    n: 1,
    icon: Search,
    color: "bg-accent/10 text-accent",
    title: "Browse",
    subtitle: "Find your car from verified importers",
    body: "Browse thousands of imported cars from the USA, UAE, Japan, Korea, Germany and more. Filter by source country, price, year, and import status. Every listing shows the full cost breakdown upfront — no surprises.",
    detail: "🇺🇸 Copart & IAAI auctions  ·  🇯🇵 USS & TAA Japan  ·  🇦🇪 Dubai dealers  ·  🇰🇷 Korean auctions",
  },
  {
    n: 2,
    icon: Calculator,
    color: "bg-blue-100 text-blue-600",
    title: "Calculate",
    subtitle: "Know the full cost before you commit",
    body: "Every listing shows the itemized landed cost: source price, international shipping, Saudi customs duty (5%), VAT (15%), port handling, and transportation to your city. No hidden fees.",
    detail: "Source price → Shipping → Customs 5% → VAT 15% → Port fees → Total",
  },
  {
    n: 3,
    icon: CreditCard,
    color: "bg-purple-100 text-purple-600",
    title: "Reserve",
    subtitle: "Pay SAR 99 to secure the car",
    body: "Place a SAR 99 reservation to hold the car and connect directly with the importer. You'll receive their contact details immediately. The reservation fee goes toward the final purchase price.",
    detail: "SAR 99 reservation  ·  Direct importer contact  ·  No middlemen",
  },
  {
    n: 4,
    icon: MapPin,
    color: "bg-green-100 text-green-600",
    title: "Track",
    subtitle: "Follow your car from source to your door",
    body: "Get live updates as your car moves through each stage: purchased at auction → loaded on vessel → arrived at Saudi port → customs cleared → inspection passed → delivered to you.",
    detail: "10-stage tracking  ·  Document uploads  ·  ETA updates",
  },
];

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------
const FAQS = [
  {
    q: "How long does importing a car take?",
    a: "It depends on the source country. From the USA it typically takes 45–70 days (auction → shipping → Dammam port → customs → delivery). Japan is usually 30–45 days. UAE is faster at 5–10 days. Your importer will give you a specific ETA based on vessel schedules.",
  },
  {
    q: "What are the total costs I should expect?",
    a: "The landed cost includes: source price (in original currency), international shipping (SAR 2,000–6,000 depending on origin), Saudi customs duty (5% of car value), VAT (15% of car + customs), port & clearance fees (~SAR 1,500–2,500), and local transportation. Every listing shows this breakdown upfront.",
  },
  {
    q: "Are all importers on this platform verified?",
    a: "Yes. All importers go through an application process where we verify their Commercial Registration (CR), customs broker license, and import permits. Verified importers display a 'Verified Importer' badge on their profile.",
  },
  {
    q: "What is the SAR 99 reservation fee for?",
    a: "The SAR 99 reservation fee holds the car for you, prevents other buyers from reserving it, and connects you directly with the importer's contact details. It is fully credited toward your final purchase price — it's not an extra charge.",
  },
  {
    q: "Can I inspect the car before it arrives in Saudi Arabia?",
    a: "Yes. Most importers provide pre-purchase inspection reports (Carfax, AutoCheck, auction photos and videos). Some offer third-party inspection services at the source country for an additional fee. You can also request post-arrival inspection once the car reaches the Saudi port.",
  },
  {
    q: "What happens if the car arrives with undisclosed damage?",
    a: "All listings must disclose salvage titles, flood damage, and frame damage. If an importer misrepresents a car's condition, you can file a dispute through our platform. We hold the reservation fee and can refund you in confirmed cases of misrepresentation.",
  },
];

// ---------------------------------------------------------------------------
// FAQ Item (client-interactive, but we can make it work server-side with details)
// ---------------------------------------------------------------------------
function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border border-slate-100 rounded-2xl bg-white overflow-hidden">
      <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none hover:bg-slate-50 transition-colors">
        <span className="font-semibold text-slate-900 text-sm pr-2">{q}</span>
        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-50 pt-4">
        {a}
      </div>
    </details>
  );
}

// ---------------------------------------------------------------------------
// Page (Server Component — no "use client" needed)
// ---------------------------------------------------------------------------
export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white pt-24 pb-16">

      {/* Hero */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-accent/10 text-accent text-sm font-semibold px-4 py-2 rounded-full mb-6">
          <Globe className="w-4 h-4" />
          Import any car · Fully transparent
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4 leading-tight">
          How Importing a Car<br className="hidden sm:block" /> Works
        </h1>
        <p className="text-slate-500 text-lg max-w-xl mx-auto">
          From browsing to delivery — 4 simple steps to get your dream imported car to your door in Saudi Arabia.
        </p>
      </div>

      {/* Steps */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-20">
        <div className="space-y-6">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isEven = i % 2 === 1;
            return (
              <div
                key={step.n}
                className={`flex flex-col ${isEven ? "sm:flex-row-reverse" : "sm:flex-row"} items-start gap-8 bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-100`}
              >
                {/* Number + Icon */}
                <div className="flex-shrink-0 flex items-center gap-4 sm:flex-col sm:items-center sm:w-32">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${step.color}`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className="text-6xl font-black text-slate-100 sm:text-center leading-none select-none hidden sm:block">
                    {step.n}
                  </div>
                  <div className="text-2xl font-black text-slate-200 sm:hidden">{step.n}</div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Step {step.n}</p>
                  <h2 className="text-2xl font-black text-slate-900 mb-1">{step.title}</h2>
                  <p className="text-accent font-semibold text-sm mb-3">{step.subtitle}</p>
                  <p className="text-slate-600 leading-relaxed mb-4">{step.body}</p>
                  <div className="inline-block bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-500 font-medium">
                    {step.detail}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Arrow connector */}
        <div className="flex justify-center my-4">
          <div className="flex flex-col items-center gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-0.5 h-3 bg-slate-200 rounded-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Trust badges */}
      <div className="bg-slate-50 border-y border-slate-100 py-12 mb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Why buy through us</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Shield,  label: "Verified Importers", sub: "CR & license checked" },
              { icon: Globe,   label: "8+ Source Countries", sub: "USA, Japan, UAE & more" },
              { icon: Clock,   label: "Live Tracking",       sub: "10-stage order updates" },
              { icon: Star,    label: "Buyer Reviews",       sub: "Real importer ratings" },
            ].map((b) => (
              <div key={b.label} className="bg-white rounded-2xl border border-slate-100 p-5 text-center">
                <b.icon className="w-6 h-6 text-accent mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-800">{b.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{b.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 mb-16">
        <h2 className="text-2xl font-black text-slate-900 text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {FAQS.map((faq) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <div className="bg-[#0a0a0a] rounded-3xl p-10 text-white">
          <Truck className="w-12 h-12 mx-auto mb-4 opacity-90" />
          <h2 className="text-2xl font-black mb-2">Ready to find your car?</h2>
          <p className="text-white/80 mb-6 text-sm">Browse imported cars from USA, Japan, Korea, UAE and more.</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/browse"
              className="flex items-center gap-2 px-8 py-3.5 bg-white text-accent font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-lg shadow-black/10"
            >
              Browse Imported Cars
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/calculator"
              className="flex items-center gap-2 px-6 py-3.5 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl transition-colors border border-white/30"
            >
              <Calculator className="w-4 h-4" />
              Cost Calculator
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
