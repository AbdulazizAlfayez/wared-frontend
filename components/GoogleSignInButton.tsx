"use client";

import Script from "next/script";
import { useEffect, useRef, useCallback } from "react";

interface Props {
  onSuccess: () => void;
  onError: (message: string) => void;
}

const GOOGLE_CLIENT_ID =
  "802876296722-1lj8pvnhvgh18r0u26qacavcsbe7t9r4.apps.googleusercontent.com";
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (element: HTMLElement, options: object) => void;
        };
      };
    };
  }
}

function getCsrf(): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|; )csrftoken=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : "";
}

export default function GoogleSignInButton({ onSuccess, onError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Stable refs so the Google callback always calls the latest handlers
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  const initGoogle = useCallback(() => {
    if (!window.google?.accounts?.id || !containerRef.current) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response: { credential: string }) => {
        try {
          const res = await fetch(`${BASE_URL}/api/auth/google/`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": getCsrf(),
            },
            body: JSON.stringify({ credential: response.credential }),
          });
          if (res.ok) {
            onSuccessRef.current();
          } else {
            const body = await res.json().catch(() => ({})) as { error?: string; detail?: string };
            onErrorRef.current(body.error ?? body.detail ?? "Google sign-in failed. Please try again.");
          }
        } catch {
          onErrorRef.current("Google sign-in failed. Please check your connection.");
        }
      },
    });

    window.google.accounts.id.renderButton(containerRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "rectangular",
      width: containerRef.current.offsetWidth || 360,
    });
  }, []);

  // If the script was already loaded (e.g. hot reload / back-navigation)
  useEffect(() => {
    if (typeof window !== "undefined" && window.google) {
      initGoogle();
    }
  }, [initGoogle]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initGoogle}
      />
      {/* Google renders its button inside this div */}
      <div ref={containerRef} className="w-full flex justify-center min-h-[44px]" />
    </>
  );
}
