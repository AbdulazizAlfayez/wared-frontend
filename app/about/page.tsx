"use client";

import Link from "next/link";
import { Shield, Users, Star, MapPin, ArrowRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function AboutPage() {
  const { t, dir } = useTranslation();

  const stats = [
    { value: "5,000+", label: t("about.carsListed") },
    { value: "10,000+", label: t("about.happyCustomers") },
    { value: "20+", label: t("about.citiesCovered") },
    { value: "98%", label: t("about.satisfactionRate") },
  ];

  const values = [
    {
      icon: Shield,
      title: t("about.trustTitle"),
      description: t("about.trustDesc"),
    },
    {
      icon: Users,
      title: t("about.customerTitle"),
      description: t("about.customerDesc"),
    },
    {
      icon: Star,
      title: t("about.qualityTitle"),
      description: t("about.qualityDesc"),
    },
  ];

  const cities = [
    "Riyadh",
    "Jeddah",
    "Mecca",
    "Medina",
    "Dammam",
    "Khobar",
    "Dhahran",
    "Taif",
    "Tabuk",
    "Abha",
    "Khamis Mushait",
    "Jubail",
    "Najran",
    "Yanbu",
    "Hail",
    "Qatif",
    "Hofuf",
    "Buraidah",
    "Jizan",
    "Al-Ahsa",
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-accent pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            {t("about.heroTitle")}
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            {t("about.heroSubtitle")}
          </p>
        </div>
      </div>

      {/* Story Section */}
      <div className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
            {t("about.ourStory")}
          </h2>
          <div className={`prose prose-lg max-w-none text-slate-600 space-y-6 ${dir === "rtl" ? "text-right" : ""}`}>
            <p>
              {t("about.storyP1")}
            </p>
            <p>
              {t("about.storyP2")}
            </p>
            <p>
              {t("about.storyP3")}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-accent mb-2">
                  {stat.value}
                </div>
                <div className="text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">
            {t("about.ourValues")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-slate-50 rounded-2xl p-8 text-center"
              >
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <value.icon className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">
                  {value.title}
                </h3>
                <p className="text-slate-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cities Coverage */}
      <div className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center gap-3 justify-center mb-4 ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
            <MapPin className="w-6 h-6 text-accent" />
            <h2 className="text-3xl font-bold text-slate-900">
              {t("about.coverageTitle")}
            </h2>
          </div>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            {t("about.coverageSubtitle")}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {cities.map((city) => (
              <Link
                key={city}
                href={`/browse?city=${encodeURIComponent(city)}`}
                className="px-4 py-2 bg-white hover:bg-accent hover:text-white text-slate-700 rounded-full text-sm font-medium border border-slate-200 hover:border-accent transition-colors"
              >
                {city}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-accent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {t("about.ctaTitle")}
          </h2>
          <p className="text-xl text-white/80 mb-8">
            {t("about.ctaSubtitle")}
          </p>
          <Link
            href="/browse"
            className={`inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-slate-50 text-accent rounded-xl font-semibold transition-colors ${dir === "rtl" ? "flex-row-reverse" : ""}`}
          >
            <span>{t("about.browseNow")}</span>
            <ArrowRight className={`w-5 h-5 ${dir === "rtl" ? "rotate-180" : ""}`} />
          </Link>
        </div>
      </div>
    </div>
  );
}
