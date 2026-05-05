"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle, ArrowRight, HelpCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function ContactPage() {
  const { t, dir } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setFormData({ name: "", email: "", subject: "", message: "" });
    setIsSubmitted(false);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: t("contactPage.email"),
      value: "support@markaba.sa",
      description: t("contactPage.emailDesc"),
    },
    {
      icon: Phone,
      title: t("contactPage.phone"),
      value: "+966 11 XXX XXXX",
      description: t("contactPage.phoneHours"),
    },
    {
      icon: MapPin,
      title: t("contactPage.office"),
      value: "Riyadh, Saudi Arabia",
      description: t("contactPage.officeDesc"),
    },
  ];

  const subjects = [
    { value: "", label: t("contactPage.selectSubject") },
    { value: "general", label: t("contactPage.subjectGeneral") },
    { value: "support", label: t("contactPage.subjectSupport") },
    { value: "listing", label: t("contactPage.subjectListing") },
    { value: "report", label: t("contactPage.subjectReport") },
    { value: "partnership", label: t("contactPage.subjectPartnership") },
    { value: "other", label: t("contactPage.subjectOther") },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            {t("contactPage.title")}
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto">
            {t("contactPage.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info Cards */}
          <div className={`space-y-4 ${dir === "rtl" ? "lg:order-2" : ""}`}>
            {contactInfo.map((info, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 border border-slate-100"
              >
                <div className={`flex items-start gap-4 ${dir === "rtl" ? "flex-row-reverse text-right" : ""}`}>
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <info.icon className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{info.title}</h3>
                    <p className="text-accent font-medium" dir="ltr">{info.value}</p>
                    <p className="text-sm text-slate-500">{info.description}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* FAQ Link */}
            <div className="bg-accent/5 rounded-2xl p-6 border border-accent/20">
              <div className={`flex items-start gap-4 ${dir === "rtl" ? "flex-row-reverse text-right" : ""}`}>
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {t("contactPage.faqTitle")}
                  </h3>
                  <p className="text-sm text-slate-500 mb-3">
                    {t("contactPage.faqDesc")}
                  </p>
                  <Link
                    href="/faq"
                    className={`text-accent hover:text-accent-600 font-medium text-sm flex items-center gap-1 ${dir === "rtl" ? "flex-row-reverse" : ""}`}
                  >
                    {t("contactPage.viewFaq")}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className={`lg:col-span-2 ${dir === "rtl" ? "lg:order-1" : ""}`}>
            <div className="bg-white rounded-2xl p-8 border border-slate-100">
              <h2 className={`text-xl font-semibold text-slate-900 mb-6 ${dir === "rtl" ? "text-right" : ""}`}>
                {t("contactPage.formTitle")}
              </h2>

              {isSubmitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    {t("contactPage.messageSent")}
                  </h3>
                  <p className="text-slate-500 mb-6">
                    {t("contactPage.thankYou")}
                  </p>
                  <button
                    onClick={handleReset}
                    className={`inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-medium transition-colors ${dir === "rtl" ? "flex-row-reverse" : ""}`}
                  >
                    <span>{t("contactPage.sendAnother")}</span>
                    <ArrowRight className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Name */}
                    <div className="space-y-2">
                      <label className={`block text-sm font-medium text-slate-700 ${dir === "rtl" ? "text-right" : ""}`}>
                        {t("contactPage.yourName")}
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder={t("contactPage.namePlaceholder")}
                        className={`w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-accent focus:ring-1 focus:ring-accent ${dir === "rtl" ? "text-right" : ""}`}
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <label className={`block text-sm font-medium text-slate-700 ${dir === "rtl" ? "text-right" : ""}`}>
                        {t("contactPage.emailAddress")}
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder={t("contactPage.emailPlaceholder")}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-accent focus:ring-1 focus:ring-accent"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <label className={`block text-sm font-medium text-slate-700 ${dir === "rtl" ? "text-right" : ""}`}>
                      {t("contactPage.subject")}
                    </label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:border-accent focus:ring-1 focus:ring-accent bg-white ${dir === "rtl" ? "text-right" : ""}`}
                    >
                      {subjects.map((subject) => (
                        <option key={subject.value} value={subject.value}>
                          {subject.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <label className={`block text-sm font-medium text-slate-700 ${dir === "rtl" ? "text-right" : ""}`}>
                      {t("contactPage.message")}
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      placeholder={t("contactPage.messagePlaceholder")}
                      className={`w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-accent focus:ring-1 focus:ring-accent resize-none ${dir === "rtl" ? "text-right" : ""}`}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-3 bg-accent hover:bg-accent-600 disabled:bg-accent/50 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${dir === "rtl" ? "flex-row-reverse" : ""}`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{t("contactPage.sending")}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>{t("contactPage.sendMessage")}</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
