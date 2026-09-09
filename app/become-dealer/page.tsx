"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function BecomeDealer() {
  const router = useRouter();
  useEffect(() => { router.replace("/become-importer"); }, [router]);
  return null;
}
