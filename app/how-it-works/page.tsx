'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// FAQ Item
// ---------------------------------------------------------------------------
function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border border-ink-100 rounded-2xl overflow-hidden" style={{ background: 'var(--mk-paper)' }}>
      <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none hover:bg-ink-50 transition-colors">
        <span className="font-semibold text-ink-900 text-sm pr-2">{q}</span>
        <ChevronDown className="w-4 h-4 text-ink-400 flex-shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-6 pb-5 text-sm text-ink-500 leading-relaxed border-t border-ink-50 pt-4">
        {a}
      </div>
    </details>
  );
}

// ---------------------------------------------------------------------------
// JourneyMap — sticky left panel with SVG route and animated car
// ---------------------------------------------------------------------------
function JourneyMap({ carProgress, t }: { carProgress: MotionValue<number>; t: (key: string) => string }) {
  const cx = useTransform(carProgress, [0, 0.33, 0.66, 1], [80, 230, 390, 520]);
  const cy = useTransform(carProgress, [0, 0.33, 0.66, 1], [200, 140, 180, 280]);

  return (
    <div
      className="h-full flex items-center justify-center border-r"
      style={{ background: 'var(--mk-paper-2)', borderColor: 'rgba(10,10,10,.06)' }}
    >
      <div className="w-full max-w-xl p-12">
        <svg viewBox="0 0 600 500" className="w-full">
          <defs>
            <pattern id="mapDots" width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="rgba(11,20,36,0.08)" />
            </pattern>
          </defs>
          <rect width="600" height="500" fill="url(#mapDots)" />

          {/* Origin port */}
          <g>
            <circle cx="80" cy="200" r="6" fill="#0D1117" />
            <circle cx="80" cy="200" r="14" fill="none" stroke="#0D1117" strokeWidth="1" opacity="0.3" />
            <text x="80" y="232" fontSize="11" fill="#0D1117" textAnchor="middle" fontWeight="500">
              {t('howItWorks.originPort')}
            </text>
            <text x="80" y="246" fontSize="9" fill="#0D1117" textAnchor="middle" opacity="0.55">
              {t('howItWorks.originCountries')}
            </text>
          </g>

          {/* Destination — Saudi Arabia */}
          <g>
            <circle cx="520" cy="280" r="8" fill="#0FA68A" />
            <circle cx="520" cy="280" r="20" fill="none" stroke="#0FA68A" strokeWidth="1.5">
              <animate attributeName="r" from="8" to="28" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
            </circle>
            <text x="520" y="312" fontSize="11" fill="#0FA68A" textAnchor="middle" fontWeight="500">
              {t('howItWorks.yourDriveway')}
            </text>
            <text x="520" y="326" fontSize="9" fill="#0FA68A" textAnchor="middle" opacity="0.7">
              {t('howItWorks.saudiArabia')}
            </text>
          </g>

          {/* Route — curved dashed line */}
          <path
            d="M 80 200 C 180 120, 320 100, 520 280"
            fill="none"
            stroke="rgba(11,20,36,0.2)"
            strokeWidth="2"
            strokeDasharray="6 6"
          />

          {/* Checkpoints */}
          {[
            { x: 230, y: 140 },
            { x: 390, y: 180 },
          ].map((pt, i) => (
            <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="rgba(11,20,36,0.25)" />
          ))}

          {/* The car — animated position */}
          <motion.g>
            <motion.circle cx={cx} cy={cy} r="16" fill="#0D1117" />
            <motion.text
              x={cx}
              y={cy}
              dy="5"
              fontSize="16"
              textAnchor="middle"
              fill="#FAFAF7"
            >
              {'🚗'}
            </motion.text>
          </motion.g>
        </svg>

        <div className="mt-8 text-center">
          <div className="text-[11px] uppercase tracking-[0.15em] text-ink-400 mb-1">
            {t('howItWorks.scrollHint')}
          </div>
          <ChevronDown className="w-4 h-4 text-ink-300 mx-auto animate-bounce" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StepVisual — different mock card per step
// ---------------------------------------------------------------------------
function StepVisual({ stepNumber, t }: { stepNumber: string; t: (key: string) => string }) {
  if (stepNumber === '01') {
    return (
      <div className="border border-ink-100 rounded-2xl p-4 flex items-center gap-3" style={{ background: 'var(--mk-paper)' }}>
        <svg className="w-[18px] h-[18px] text-ink-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="text-[14px] text-ink-400">{t('howItWorks.searchMock')}</span>
        <span className="ml-auto text-[12px] text-teal-600 font-medium">{t('howItWorks.searchResults')}</span>
      </div>
    );
  }

  if (stepNumber === '02') {
    return (
      <div className="border border-ink-100 rounded-2xl p-5 text-[13px]" style={{ background: 'var(--mk-paper)' }}>
        <div className="text-[11px] uppercase tracking-wider text-ink-400 mb-3">{t('howItWorks.breakdownTitle')}</div>
        <div className="space-y-1.5">
          {[
            [t('calculator.sourcePrice'), '95,000'],
            [t('calculator.shipping'), '6,200'],
            [t('calculator.customsDuty') + ' + ' + t('calculator.vat'), '20,150'],
            [t('calculator.inspection') + ' + ' + t('calculator.importerMargin'), '20,650'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <span className="text-ink-400">{label}</span>
              <span className="tabular-nums font-medium text-ink-900">SAR {value}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-ink-100 flex justify-between">
          <span className="text-[12px] uppercase tracking-wider text-ink-400">{t('howItWorks.breakdownFinal')}</span>
          <span className="text-[18px] font-medium tabular-nums text-ink-900">SAR 142,000</span>
        </div>
      </div>
    );
  }

  if (stepNumber === '03') {
    return (
      <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-[18px] h-[18px] text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium text-teal-800 text-[14px]">{t('howItWorks.reservationConfirmed')}</span>
        </div>
        <p className="text-[12.5px] text-teal-700/85">
          {t('howItWorks.reservationFee')}
        </p>
      </div>
    );
  }

  if (stepNumber === '04') {
    return (
      <div className="border border-ink-100 rounded-2xl p-5" style={{ background: 'var(--mk-paper)' }}>
        <div className="text-[11px] uppercase tracking-wider text-ink-400 mb-4">{t('howItWorks.liveTracking')}</div>
        {[
          { label: t('howItWorks.auctionWon'), date: 'Mar 9', done: true, active: false },
          { label: t('howItWorks.inTransit'), date: 'Mar 23', done: false, active: true },
          { label: t('howItWorks.arrivingJeddah'), date: 'Mar 30', done: false, active: false },
        ].map((e, i, arr) => (
          <div key={i} className="flex items-start gap-3 py-2">
            <div className="relative flex flex-col items-center">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  e.done
                    ? 'bg-teal-500'
                    : e.active
                      ? 'bg-teal-500 ring-2 ring-teal-200 animate-pulse'
                      : 'bg-ink-200'
                }`}
              />
              {i < arr.length - 1 && (
                <div className={`w-0.5 h-6 mt-1 ${e.done ? 'bg-teal-500' : 'bg-ink-100'}`} />
              )}
            </div>
            <div className="flex-1 flex justify-between items-baseline text-[13px]">
              <span className={e.done || e.active ? 'text-ink-900 font-medium' : 'text-ink-300'}>
                {e.label}
              </span>
              <span className="text-[11.5px] text-ink-400 tabular-nums">{e.date}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// StepSection — each scroll-anchored step
// ---------------------------------------------------------------------------
function StepSection({ step, index }: { step: { number: string; title: string; tagline: string; description: string; carPosition: number }; index: number }) {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.5], [40, 0]);
  const { t } = useTranslation();

  // Step icons as inline SVGs
  const icons: Record<string, React.ReactNode> = {
    '01': (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    '02': (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    '03': (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    ),
    '04': (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  };

  return (
    <section ref={sectionRef} className="min-h-screen flex items-center px-8 lg:px-12 py-24">
      <motion.div style={{ opacity, y }} className="max-w-lg">
        <div className="flex items-center gap-3 mb-8">
          <span className="text-[12px] font-medium text-ink-300 tabular-nums tracking-wider">
            STEP {step.number}
          </span>
          <div className="h-px flex-1 bg-ink-100" />
          <div className="w-10 h-10 rounded-xl bg-ink-50 flex items-center justify-center text-ink-900">
            {icons[step.number]}
          </div>
        </div>

        <h2 className="text-[44px] leading-[1.05] tracking-tight font-light mb-3 text-ink-900">
          {step.title}
        </h2>
        <p className="text-[18px] text-ink-400 mb-6 font-serif italic">{step.tagline}</p>
        <p className="text-[15px] text-ink-500 leading-[1.7] mb-8">{step.description}</p>

        <StepVisual stepNumber={step.number} t={t} />
      </motion.div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function HowItWorksPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t, dir } = useTranslation();
  const isRTL = dir === 'rtl';

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const carProgress = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const STEPS = [
    {
      number: '01',
      title: t('howItWorks.step01Title'),
      tagline: t('howItWorks.step01Tagline'),
      description: t('howItWorks.step01Desc'),
      carPosition: 0,
    },
    {
      number: '02',
      title: t('howItWorks.step02Title'),
      tagline: t('howItWorks.step02Tagline'),
      description: t('howItWorks.step02Desc'),
      carPosition: 0.33,
    },
    {
      number: '03',
      title: t('howItWorks.step03Title'),
      tagline: t('howItWorks.step03Tagline'),
      description: t('howItWorks.step03Desc'),
      carPosition: 0.66,
    },
    {
      number: '04',
      title: t('howItWorks.step04Title'),
      tagline: t('howItWorks.step04Tagline'),
      description: t('howItWorks.step04Desc'),
      carPosition: 1,
    },
  ];

  const FAQS = [
    { q: t('howItWorks.faq1q'), a: t('howItWorks.faq1a') },
    { q: t('howItWorks.faq2q'), a: t('howItWorks.faq2a') },
    { q: t('howItWorks.faq3q'), a: t('howItWorks.faq3a') },
    { q: t('howItWorks.faq4q'), a: t('howItWorks.faq4a') },
    { q: t('howItWorks.faq5q'), a: t('howItWorks.faq5a') },
    { q: t('howItWorks.faq6q'), a: t('howItWorks.faq6a') },
  ];

  return (
    <main style={{ background: 'var(--mk-paper)' }}>
      {/* HERO */}
      <section className="px-8 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ink-900/5 text-ink-500 text-[12.5px] mb-6">
          <svg className="w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t('howItWorks.badge')}
        </div>
        <h1
          className="leading-[1.05] tracking-tight font-light max-w-3xl mx-auto mb-5 text-ink-900"
          style={{ fontSize: 'clamp(36px, 5vw, 56px)' }}
        >
          {t('howItWorks.title1')}
          <br />
          <span className="font-serif italic">{t('howItWorks.title2')}</span>
        </h1>
        <p className="text-[17px] text-ink-400 max-w-xl mx-auto leading-relaxed">
          {t('howItWorks.subtitle')}
        </p>
      </section>

      {/* SCROLL-DRIVEN JOURNEY */}
      <div ref={containerRef} className="relative">
        {/* Sticky map — desktop only */}
        <div className={`hidden lg:block sticky top-0 h-screen w-1/2 ${isRTL ? 'float-right' : 'float-left'} pointer-events-none z-10`}>
          <JourneyMap carProgress={carProgress} t={t} />
        </div>

        {/* Scrollable step content */}
        <div className={`lg:w-1/2 ${isRTL ? 'lg:mr-[50%]' : 'lg:ml-[50%]'}`}>
          {STEPS.map((step, idx) => (
            <StepSection key={step.number} step={step} index={idx} />
          ))}
        </div>

        <div className="clear-both" />
      </div>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-8 py-20">
        <h2 className="text-[28px] font-light tracking-tight text-ink-900 text-center mb-8">
          {t('howItWorks.faqTitle')}
        </h2>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <FAQItem key={i} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-8" style={{ background: 'var(--mk-ink)', color: 'var(--mk-paper)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-[40px] tracking-tight font-light mb-4">
            {t('howItWorks.ctaTitle1')} <span className="font-serif italic">{t('howItWorks.ctaTitle2')}</span>
          </h2>
          <p className="text-[16px] opacity-70 max-w-lg mx-auto mb-8">
            {t('howItWorks.ctaSubtitle')}
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/calculator"
              className="px-7 py-3.5 rounded-full text-[14px] font-medium transition hover:opacity-90"
              style={{ background: 'var(--mk-paper)', color: 'var(--mk-ink)' }}
            >
              {t('howItWorks.ctaCalculator')}
            </Link>
            <Link
              href="/browse"
              className="px-7 py-3.5 rounded-full border text-[14px] font-medium transition hover:bg-white/10"
              style={{ borderColor: 'rgba(250,250,247,.3)', color: 'var(--mk-paper)' }}
            >
              {t('howItWorks.ctaBrowse')} &rarr;
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
