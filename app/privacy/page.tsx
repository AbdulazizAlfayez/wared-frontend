"use client";

import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function PrivacyPage() {
  const { t, dir } = useTranslation();

  const sections = [
    "collection",
    "usage",
    "sharing",
    "security",
    "cookies",
    "rights",
    "retention",
    "children",
    "international",
    "changes",
    "contact",
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/"
          className={`inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 ${dir === "rtl" ? "flex-row-reverse" : ""}`}
        >
          <ArrowLeft className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
          <span>{t("common.back")}</span>
        </Link>

        {/* Page Header */}
        <div className="bg-white rounded-2xl border border-slate-100 p-8 mb-8">
          <div className={`flex items-center gap-4 mb-6 ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
            <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {t("privacy.title")}
              </h1>
              <p className="text-slate-500">
                {t("privacy.lastUpdated")}: January 1, 2026
              </p>
            </div>
          </div>
          <p className="text-slate-600 leading-relaxed">
            {t("privacy.intro")}
          </p>
        </div>

        {/* Privacy Content */}
        <div className="bg-white rounded-2xl border border-slate-100 p-8">
          <div className="prose prose-navy max-w-none">
            {sections.map((sectionKey, index) => (
              <section key={sectionKey} className={index > 0 ? "mt-8" : ""}>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  {t(`privacy.sections.${sectionKey}.title`)}
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  {t(`privacy.sections.${sectionKey}.content`)}
                </p>
              </section>
            ))}
          </div>
        </div>

        {/* Footer Links */}
        <div className={`mt-8 flex flex-wrap justify-center gap-4 text-sm ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
          <Link href="/terms" className="text-accent hover:text-accent-600">
            {t("footer.termsOfService")}
          </Link>
          <span className="text-slate-300">•</span>
          <Link href="/contact" className="text-accent hover:text-accent-600">
            {t("nav.contact")}
          </Link>
          <span className="text-slate-300">•</span>
          <Link href="/faq" className="text-accent hover:text-accent-600">
            {t("contactPage.faqTitle")}
          </Link>
        </div>
      </div>
    </div>
  );
}
