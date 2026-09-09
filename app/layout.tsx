import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/components/Toast";
import { I18nClientProvider } from "./I18nClientProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VerificationGate from "@/components/VerificationGate";
import AssistantWidget from "@/components/AssistantWidget";

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
      <head>
        {/* Fonts loaded via <link> — non-blocking, never stalls the build */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&family=Geist:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700&family=Tajawal:wght@400;500;700&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="font-body antialiased min-h-screen flex flex-col bg-white text-slate-900 transition-colors"
      >
          <AuthProvider>
            <ToastProvider>
              <VerificationGate>
                <I18nClientProvider>
                  <Header />
                  <main className="flex-1">{children}</main>
                  <Footer />
                  <AssistantWidget />
                </I18nClientProvider>
              </VerificationGate>
            </ToastProvider>
          </AuthProvider>
      </body>
    </html>
  );
}
