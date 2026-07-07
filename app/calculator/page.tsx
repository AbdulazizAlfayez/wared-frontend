'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

// TODO: replace with /api/calculator/exchange-rates/ once
// exchange rate data is being updated daily via Celery Beat
const EXCHANGE_RATES: Record<string, number> = {
  usd: 3.75,
  jpy: 0.025,
  krw: 0.00285,
  aed: 1.02,
  eur: 4.10,
  gbp: 4.75,
};

const SHIPPING_ESTIMATES: Record<string, { min: number; max: number; avg: number; days: string }> = {
  usa:    { min: 4000, max: 8000, avg: 6200, days: '35\u201345' },
  japan:  { min: 3500, max: 6500, avg: 5000, days: '25\u201335' },
  korea:  { min: 3000, max: 6000, avg: 4500, days: '22\u201330' },
  uae:    { min: 1000, max: 2500, avg: 1800, days: '5\u201310' },
  europe: { min: 5000, max: 9000, avg: 7000, days: '30\u201340' },
};

const SOURCE_COUNTRIES = [
  { code: 'usa',    name: 'United States', flag: '\u{1F1FA}\u{1F1F8}', currency: 'usd' },
  { code: 'japan',  name: 'Japan',         flag: '\u{1F1EF}\u{1F1F5}', currency: 'jpy' },
  { code: 'korea',  name: 'South Korea',   flag: '\u{1F1F0}\u{1F1F7}', currency: 'krw' },
  { code: 'uae',    name: 'UAE',           flag: '\u{1F1E6}\u{1F1EA}', currency: 'aed' },
  { code: 'europe', name: 'Europe',        flag: '\u{1F1EA}\u{1F1FA}', currency: 'eur' },
];

export default function CalculatorPage() {
  const { t } = useTranslation();
  const [sourceCountry, setSourceCountry] = useState('usa');
  const [carPrice, setCarPrice] = useState<number>(16000);
  const [year, setYear] = useState<number>(2024);
  const [engineSize, setEngineSize] = useState<number>(3.5);
  const [isGccSpec, setIsGccSpec] = useState(false);

  const country = SOURCE_COUNTRIES.find(c => c.code === sourceCountry)!;
  const rate = EXCHANGE_RATES[country.currency];
  const shipping = SHIPPING_ESTIMATES[sourceCountry];

  const calculation = useMemo(() => {
    const carPriceSar = carPrice * rate;
    const shippingSar = shipping.avg;
    const customsDuty = carPriceSar * 0.05;
    const vatBase = carPriceSar + shippingSar + customsDuty;
    const vat = vatBase * 0.15;
    const inspection = 1200;
    const portHandling = 800;
    const transportation = 1500;
    const importerMargin = carPriceSar * 0.12;
    const total = carPriceSar + shippingSar + customsDuty + vat
                + inspection + portHandling + transportation + importerMargin;

    return {
      carPriceSar: Math.round(carPriceSar),
      shipping: Math.round(shippingSar),
      customsDuty: Math.round(customsDuty),
      vat: Math.round(vat),
      inspection,
      portHandling,
      transportation,
      importerMargin: Math.round(importerMargin),
      total: Math.round(total),
    };
  }, [carPrice, rate, shipping]);

  return (
    <main style={{ background: 'var(--mk-paper)' }} className="px-8 py-12 lg:py-20">
      <div className="max-w-6xl mx-auto">

        {/* HERO */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ink-900/5 text-ink-500 text-[12.5px] mb-5">
            <svg className="w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            {t('calculator.badge')}
          </div>
          <h1
            className="leading-[1.05] tracking-tight font-light mb-4 text-ink-900"
            style={{ fontSize: 'clamp(36px, 5vw, 52px)' }}
          >
            {t('calculator.title1')}
            <br />
            <span className="font-serif italic">{t('calculator.title2')}</span>
          </h1>
          <p className="text-[16px] text-ink-400 max-w-xl mx-auto leading-relaxed">
            {t('calculator.subtitle')}
          </p>
        </div>

        {/* TWO-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-8 lg:gap-12 items-start">

          {/* LEFT — INPUTS */}
          <div className="border border-ink-100 rounded-2xl p-6 lg:p-8 space-y-6" style={{ background: 'var(--mk-paper)' }}>

            {/* Source country */}
            <div>
              <label className="block text-[12px] uppercase tracking-[0.12em] text-ink-400 font-medium mb-3">
                {t('calculator.sourceCountry')}
              </label>
              <div className="grid grid-cols-5 gap-2">
                {SOURCE_COUNTRIES.map(c => (
                  <button
                    key={c.code}
                    onClick={() => setSourceCountry(c.code)}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition ${
                      sourceCountry === c.code
                        ? 'bg-ink-900 text-white border-ink-900'
                        : 'bg-ink-50 text-ink-900 border-ink-100 hover:border-ink-300'
                    }`}
                  >
                    <span className="text-[20px]">{c.flag}</span>
                    <span className="text-[10.5px] font-medium">{c.code.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Car price */}
            <div>
              <label className="block text-[12px] uppercase tracking-[0.12em] text-ink-400 font-medium mb-3">
                {t('calculator.carPrice')} {country.currency.toUpperCase()}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] text-ink-300 uppercase">
                  {country.currency}
                </span>
                <input
                  type="number"
                  value={carPrice || ''}
                  onChange={e => setCarPrice(Number(e.target.value) || 0)}
                  placeholder="16000"
                  className="w-full pl-16 pr-4 py-3.5 bg-ink-50 border border-ink-100 rounded-xl text-[16px] font-medium tabular-nums focus:outline-none focus:border-ink-400 transition text-ink-900"
                />
              </div>
            </div>

            {/* Year + Engine size */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] uppercase tracking-[0.12em] text-ink-400 font-medium mb-3">
                  {t('calculator.modelYear')}
                </label>
                <input
                  type="number"
                  value={year || ''}
                  onChange={e => setYear(Number(e.target.value) || 2024)}
                  min="2000"
                  max="2030"
                  className="w-full px-4 py-3.5 bg-ink-50 border border-ink-100 rounded-xl text-[16px] font-medium tabular-nums focus:outline-none focus:border-ink-400 transition text-ink-900"
                />
              </div>
              <div>
                <label className="block text-[12px] uppercase tracking-[0.12em] text-ink-400 font-medium mb-3">
                  {t('calculator.engineSize')}
                </label>
                <input
                  type="number"
                  value={engineSize || ''}
                  onChange={e => setEngineSize(Number(e.target.value) || 0)}
                  step="0.1"
                  className="w-full px-4 py-3.5 bg-ink-50 border border-ink-100 rounded-xl text-[16px] font-medium tabular-nums focus:outline-none focus:border-ink-400 transition text-ink-900"
                />
              </div>
            </div>

            {/* GCC spec toggle */}
            <div className="flex items-center justify-between p-4 bg-ink-50 rounded-xl border border-ink-100">
              <div>
                <div className="text-[14px] font-medium text-ink-900">{t('calculator.gccSpec')}</div>
                <div className="text-[12px] text-ink-400 mt-0.5">{t('calculator.gccSpecDesc')}</div>
              </div>
              <button
                onClick={() => setIsGccSpec(!isGccSpec)}
                className={`relative w-12 h-6 rounded-full transition ${isGccSpec ? 'bg-teal-500' : 'bg-ink-200'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${isGccSpec ? 'translate-x-6' : ''}`} />
              </button>
            </div>

            {/* Year warning */}
            {year > 0 && 2026 - year > 5 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-[12.5px] text-amber-800">
                <svg className="w-[14px] h-[14px] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>
                  {t('calculator.yearWarning')}
                </span>
              </div>
            )}
          </div>

          {/* RIGHT — STICKY RESULT */}
          <div className="lg:sticky lg:top-24">
            <div className="rounded-2xl p-6 lg:p-8" style={{ background: 'var(--mk-ink)', color: 'var(--mk-paper)' }}>

              <div className="text-[11px] uppercase tracking-[0.15em] opacity-55 mb-2">
                {t('calculator.estimatedCost')}
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-[14px] opacity-55">SAR</span>
                <span className="text-[48px] font-medium tracking-tight tabular-nums">
                  {calculation.total.toLocaleString()}
                </span>
              </div>
              <div className="text-[12.5px] opacity-55 mb-6">
                {t('calculator.finalDelivered')}
              </div>

              <div className="h-px bg-white/15 mb-5" />

              {/* Itemized breakdown */}
              <div className="space-y-2.5 text-[13.5px]">
                {[
                  { label: t('calculator.sourcePrice'), value: calculation.carPriceSar },
                  { label: `${t('calculator.shipping')} (${shipping.days} ${t('calculator.days')})`, value: calculation.shipping },
                  { label: t('calculator.customsDuty'), value: calculation.customsDuty },
                  { label: t('calculator.vat'), value: calculation.vat },
                  { label: t('calculator.inspection'), value: calculation.inspection },
                  { label: t('calculator.portHandling'), value: calculation.portHandling },
                  { label: t('calculator.transportation'), value: calculation.transportation },
                  { label: t('calculator.importerMargin'), value: calculation.importerMargin },
                ].map(line => (
                  <div key={line.label} className="flex justify-between">
                    <span className="opacity-70">{line.label}</span>
                    <span className="tabular-nums">SAR {line.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="h-px bg-white/15 my-5" />

              <div className="text-[11.5px] opacity-55 text-center mb-6">
                {t('calculator.conversionRate')} 1 {country.currency.toUpperCase()} = {rate} SAR &middot; {t('calculator.ratesUpdated')}
              </div>

              <Link
                href={`/browse?source_country=${sourceCountry}&max_price=${calculation.total}`}
                className="block w-full py-3.5 rounded-full text-[14px] font-medium text-center transition hover:opacity-90"
                style={{ background: 'var(--mk-paper)', color: 'var(--mk-ink)' }}
              >
                {t('calculator.findCar')} &rarr;
              </Link>
            </div>

            <p className="text-[11.5px] text-ink-300 text-center mt-4 px-4 leading-relaxed">
              {t('calculator.disclaimer')}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
