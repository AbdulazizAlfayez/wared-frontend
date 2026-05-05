"use client";

import SearchBox from "./SearchBox";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function Hero() {
  const { t, locale } = useTranslation();

  const scrollToInfo = () => {
    const infoSection = document.getElementById("info-section");
    if (infoSection) {
      infoSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center">
      {/* Background Image - Abha Mountains Highway */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/bgimage1.jpeg')`,
        }}
      />
      
      {/* Overlay Gradient */}
      <div className="absolute inset-0 hero-gradient" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
          {t("hero.title")}
          <br />
          <span className="text-accent">
            {locale === "ar" ? "في السعودية" : "in Saudi Arabia"}
          </span>
        </h1>
        
        <p className="text-xl sm:text-2xl text-white/80 mb-12 max-w-2xl mx-auto">
          {t("hero.subtitle")}
        </p>

        {/* Search Box */}
        <SearchBox />

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          {[
            { label: "SUV",        href: "/browse?body_type=suv"                              },
            { label: "Sedan",      href: "/browse?body_type=sedan"                            },
            { label: "Luxury",     href: "/browse?body_type=luxury"                           },
            { label: "Under 50K",  href: "/browse?max_price=50000"                            },
            { label: "New Cars",   href: "/browse?condition=new"                              },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="px-4 py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 text-white text-sm font-medium backdrop-blur-sm transition-all hover:-translate-y-0.5"
            >
              {label}
            </a>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-white">10K+</div>
            <div className="text-white/60 text-sm sm:text-base">
              {locale === "ar" ? "سيارة معروضة" : "Cars Listed"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-white">5K+</div>
            <div className="text-white/60 text-sm sm:text-base">
              {locale === "ar" ? "عميل سعيد" : "Happy Customers"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-white">13</div>
            <div className="text-white/60 text-sm sm:text-base">
              {locale === "ar" ? "مدينة" : "Cities Covered"}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <button
        onClick={scrollToInfo}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/60 hover:text-white transition-colors animate-bounce"
        aria-label="Scroll down"
      >
        <ChevronDown className="w-8 h-8" />
      </button>
    </section>
  );
}
