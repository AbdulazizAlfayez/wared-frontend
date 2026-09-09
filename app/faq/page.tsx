"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, HelpCircle, ShoppingCart, Tag, Shield, CreditCard, ArrowRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface FAQItem {
  questionKey: string;
  answerKey: string;
}

interface FAQCategory {
  id: string;
  icon: React.ElementType;
  questions: FAQItem[];
}

export default function FAQPage() {
  const { t, dir } = useTranslation();
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (key: string) => {
    setOpenItems((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const categories: FAQCategory[] = [
    {
      id: "buying",
      icon: ShoppingCart,
      questions: [
        { questionKey: "howToBuy", answerKey: "howToBuyAnswer" },
        { questionKey: "isItSafe", answerKey: "isItSafeAnswer" },
        { questionKey: "canITestDrive", answerKey: "canITestDriveAnswer" },
      ],
    },
    {
      id: "selling",
      icon: Tag,
      questions: [
        { questionKey: "howToSell", answerKey: "howToSellAnswer" },
        { questionKey: "listingFee", answerKey: "listingFeeAnswer" },
        { questionKey: "howLongListing", answerKey: "howLongListingAnswer" },
      ],
    },
    {
      id: "account",
      icon: Shield,
      questions: [
        { questionKey: "createAccount", answerKey: "createAccountAnswer" },
        { questionKey: "forgotPassword", answerKey: "forgotPasswordAnswer" },
        { questionKey: "deleteAccount", answerKey: "deleteAccountAnswer" },
      ],
    },
    {
      id: "payments",
      icon: CreditCard,
      questions: [
        { questionKey: "paymentMethods", answerKey: "paymentMethodsAnswer" },
        { questionKey: "platformFees", answerKey: "platformFeesAnswer" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            {t("faq.title")}
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto">
            {t("faq.subtitle")}
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              {/* Category Header */}
              <div className={`bg-slate-50 px-6 py-4 flex items-center gap-3 ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                  <category.icon className="w-5 h-5 text-accent" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {t(`faq.categories.${category.id}`)}
                </h2>
              </div>

              {/* Questions */}
              <div className="divide-y divide-slate-100">
                {category.questions.map((item) => {
                  const itemKey = `${category.id}-${item.questionKey}`;
                  const isOpen = openItems.includes(itemKey);

                  return (
                    <div key={itemKey}>
                      <button
                        onClick={() => toggleItem(itemKey)}
                        className={`w-full px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-slate-50 transition-colors ${dir === "rtl" ? "flex-row-reverse text-right" : ""}`}
                      >
                        <span className="font-medium text-slate-900">
                          {t(`faq.questions.${item.questionKey}`)}
                        </span>
                        <ChevronDown
                          className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className={`px-6 pb-4 ${dir === "rtl" ? "text-right" : ""}`}>
                          <p className="text-slate-600 leading-relaxed">
                            {t(`faq.questions.${item.answerKey}`)}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Still Have Questions CTA */}
        <div className="mt-12 bg-accent rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            {t("faq.stillHaveQuestions")}
          </h2>
          <p className="text-white/80 mb-6">
            {t("faq.contactSupport")}
          </p>
          <Link
            href="/contact"
            className={`inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-accent rounded-xl font-semibold transition-colors ${dir === "rtl" ? "flex-row-reverse" : ""}`}
          >
            <span>{t("faq.contactUs")}</span>
            <ArrowRight className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
          </Link>
        </div>
      </div>
    </div>
  );
}
