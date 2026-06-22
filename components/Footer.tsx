"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function Footer() {
  const { t, dir, locale } = useTranslation();

  const sourceCountries = [
    { code: "usa",    flag: "🇺🇸", en: "United States", ar: "الولايات المتحدة" },
    { code: "japan",  flag: "🇯🇵", en: "Japan",         ar: "اليابان" },
    { code: "korea",  flag: "🇰🇷", en: "South Korea",   ar: "كوريا الجنوبية" },
    { code: "uae",    flag: "🇦🇪", en: "UAE",           ar: "الإمارات" },
    { code: "europe", flag: "🇪🇺", en: "Europe",        ar: "أوروبا" },
  ];

  return (
    <footer className="bg-slate-900 border-t border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className={`flex items-center gap-3 ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
              <Image
                src="/wared-logo-black.svg"
                alt="WARED"
                width={56}
                height={56}
                className="w-14 h-14 object-contain"
              />
              <span className="text-white font-semibold text-xl tracking-widest font-display">
                WARED
              </span>
            </Link>
            <p className={`text-slate-300 text-sm ${dir === "rtl" ? "text-right" : ""}`}>
              {t("footer.description")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t("footer.quickLinks")}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/browse" className="text-slate-300 hover:text-white text-sm">
                  {t("footer.browse")}
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-slate-300 hover:text-white text-sm">
                  {t("footer.aboutUs")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-300 hover:text-white text-sm">
                  {t("footer.contact")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Source Countries */}
          <div>
            <h3 className="text-white font-semibold mb-4">
              {locale === "ar" ? "دول الاستيراد" : "Source countries"}
            </h3>
            <ul className="space-y-2">
              {sourceCountries.map((c) => (
                <li key={c.code}>
                  <Link href={`/browse?source_country=${c.code}`} className="text-slate-300 hover:text-white text-sm">
                    {c.flag} {locale === "ar" ? c.ar : c.en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t("contact.title")}</h3>
            <ul className="space-y-3">
              <li className={`flex items-center gap-2 text-slate-300 text-sm ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
                <Mail className="w-4 h-4" />
                <span>support@wared.sa</span>
              </li>
              <li className={`flex items-center gap-2 text-slate-300 text-sm ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
                <Phone className="w-4 h-4" />
                <span dir="ltr">+966 11 XXX XXXX</span>
              </li>
              <li className={`flex items-center gap-2 text-slate-300 text-sm ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
                <MapPin className="w-4 h-4" />
                <span>{locale === "ar" ? "الرياض، المملكة العربية السعودية" : "Riyadh, Saudi Arabia"}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={`mt-12 pt-8 border-t border-slate-700/50 flex flex-col sm:flex-row justify-between items-center gap-4 ${dir === "rtl" ? "sm:flex-row-reverse" : ""}`}>
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} WARED. {t("footer.allRightsReserved")}
          </p>
          <div className={`flex items-center gap-6 ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
            <Link href="/privacy" className="text-slate-400 hover:text-white text-sm">
              {t("footer.privacyPolicy")}
            </Link>
            <Link href="/terms" className="text-slate-400 hover:text-white text-sm">
              {t("footer.termsOfService")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
