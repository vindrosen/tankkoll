"use client";

import { useEffect } from "react";
import { asset } from "@/lib/asset";

export function SwRegistrar() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }
    void navigator.serviceWorker.register(asset("/sw.js"), {
      scope: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/`,
    });
  }, []);
  return null;
}
