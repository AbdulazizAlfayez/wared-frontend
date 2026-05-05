"use client";

import { useI18n } from "@/lib/i18n";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  const toggleLocale = () => {
    setLocale(locale === "en" ? "ar" : "en");
  };

  return (
    <button
      onClick={toggleLocale}
      className="flex items-center space-x-1.5 rtl:space-x-reverse px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-sm font-medium"
      aria-label={locale === "en" ? "Switch to Arabic" : "Switch to English"}
    >
      <Globe className="w-4 h-4" />
      <span>{locale === "en" ? "العربية" : "EN"}</span>
    </button>
  );
}
