"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Shield, GitCompare, Car } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const slideImages = ["/image1.jpg", "/image2.jpg", "/image3.jpg", "/image4.jpg"];

export default function RevolutInfoSection() {
  const { t, dir } = useTranslation();
  const [activeSlide, setActiveSlide] = useState(0);

  // Translated slides
  const slides = [
    {
      id: "default",
      headline: t("info.headline"),
      subheadline: t("info.subheadline"),
      image: slideImages[0],
    },
    {
      id: "verified",
      headline: t("info.verifiedHeadline"),
      subheadline: t("info.verifiedSubheadline"),
      image: slideImages[1],
    },
    {
      id: "compare",
      headline: t("info.compareHeadline"),
      subheadline: t("info.compareSubheadline"),
      image: slideImages[2],
    },
    {
      id: "testdrive",
      headline: t("info.testDriveHeadline"),
      subheadline: t("info.testDriveSubheadline"),
      image: slideImages[3],
    },
  ];

  const chips = [
    { id: "verified", label: t("info.verified"), icon: Shield },
    { id: "compare", label: t("info.compareChip"), icon: GitCompare },
    { id: "testdrive", label: t("info.testDriveChip"), icon: Car },
  ];

  const handleChipClick = (chipId: string) => {
    const index = slides.findIndex((s) => s.id === chipId);
    if (index !== -1) {
      setActiveSlide(index);
    }
  };

  const currentSlide = slides[activeSlide];

  return (
    <section className="relative min-h-[80vh] lg:min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Images */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-500 ease-out ${
            activeSlide === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={slide.image}
            alt={slide.headline}
            fill
            className="object-cover"
            sizes="100vw"
            priority={index === 0}
          />
        </div>
      ))}

      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Headline */}
        <div className="mb-8">
          <h2
            key={currentSlide.headline}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight animate-fade-in"
          >
            {currentSlide.headline}
          </h2>
          <p
            key={currentSlide.subheadline}
            className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed animate-fade-in"
          >
            {currentSlide.subheadline}
          </p>
        </div>

        {/* Disclaimer (Revolut-style) */}
        <p className="text-xs text-white/40 mb-8">
          {t("info.disclaimer")}
        </p>

        {/* CTA Button */}
        <Link
          href="/browse"
          className={`inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-white/90 text-slate-900 rounded-full font-semibold transition-colors shadow-xl mb-12 ${dir === "rtl" ? "flex-row-reverse" : ""}`}
        >
          <span>{t("info.exploreCars")}</span>
          <ArrowRight className={`w-5 h-5 ${dir === "rtl" ? "rotate-180" : ""}`} />
        </Link>

        {/* Chips */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {chips.map((chip) => {
            const Icon = chip.icon;
            const isActive = slides[activeSlide].id === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => handleChipClick(chip.id)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-300 ${dir === "rtl" ? "flex-row-reverse" : ""} ${
                  isActive
                    ? "bg-white text-slate-900 shadow-lg"
                    : "bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm border border-white/20"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}
