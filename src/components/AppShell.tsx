"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { ToastViewport } from "./Toast";

export function AppShell({ children }: { children: React.ReactNode }) {
  const hydrate = useAppStore((s) => s.hydrate);
  const theme = useAppStore((s) => s.settings.theme);
  const hydrated = useAppStore((s) => s.hydrated);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated) {
      document.documentElement.dataset.theme = theme;
    }
  }, [theme, hydrated]);

  return (
    <div className="min-h-screen lg:flex">
      <a
        href="#innehall"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
      >
        Hoppa till innehållet
      </a>
      <Sidebar />
      <main
        id="innehall"
        className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10"
      >
        {children}
      </main>
      <BottomNav />
      <ToastViewport />
    </div>
  );
}
