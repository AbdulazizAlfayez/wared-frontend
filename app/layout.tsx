import type { Metadata } from "next";
import { Bricolage_Grotesque, Outfit } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/components/Toast";
import { I18nClientProvider } from "./I18nClientProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VerificationGate from "@/components/VerificationGate";

const bricolage = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "وارد | WARED",
  description: "استورد سيارتك من أي مكان في العالم مع ضمان التوثيق. Import verified cars from anywhere in the world.",
  keywords: "wared, وارد, استيراد سيارات, import cars, saudi arabia, verified cars, riyadh, جدة, الرياض",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body
        className={`${bricolage.variable} ${outfit.variable} ${GeistSans.variable} antialiased min-h-screen flex flex-col bg-white text-slate-900 transition-colors`}
      >
          <AuthProvider>
            <ToastProvider>
              <VerificationGate>
                <I18nClientProvider>
                  <Header />
                  <main className="flex-1">{children}</main>
                  <Footer />
                </I18nClientProvider>
              </VerificationGate>
            </ToastProvider>
          </AuthProvider>
      </body>
    </html>
  );
}
