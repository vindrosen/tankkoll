"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon } from "lucide-react";
import { asset } from "@/lib/asset";
import { useActiveVehicle, useAppStore } from "@/store/useAppStore";
import { NAV_ITEMS } from "./nav-items";

export function Sidebar() {
  const pathname = usePathname();
  const activeVehicle = useActiveVehicle();
  const theme = useAppStore((s) => s.settings.theme);
  const updateSettings = useAppStore((s) => s.updateSettings);

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-card/60 px-4 py-6 lg:flex">
      <Link href="/" className="flex items-center gap-3 px-2" aria-label="TankKoll – till översikten">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("/images/logo.webp")} alt="" width={36} height={36} />
        <span className="text-xl font-bold tracking-tight">TankKoll</span>
      </Link>

      <nav aria-label="Huvudmeny" className="mt-8 flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/15 text-ink"
                  : "text-ink-muted hover:bg-card-raised hover:text-ink"
              }`}
            >
              <Icon size={18} aria-hidden className={active ? "text-primary" : ""} />
              {label}
            </Link>
          );
        })}
      </nav>

      {activeVehicle && (
        <Link
          href="/bilar"
          className="mb-4 flex items-center gap-3 rounded-xl border border-line bg-card px-3 py-3 transition-colors hover:bg-card-raised"
        >
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-sm"
          >
            🚗
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">
              {activeVehicle.name}
            </span>
            {activeVehicle.registrationNumber && (
              <span className="block text-xs text-ink-muted">
                {activeVehicle.registrationNumber}
              </span>
            )}
          </span>
        </Link>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={theme === "dark"}
        onClick={() =>
          void updateSettings({ theme: theme === "dark" ? "light" : "dark" })
        }
        className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-card-raised hover:text-ink"
      >
        <span className="flex items-center gap-3">
          <Moon size={18} aria-hidden />
          Mörkt läge
        </span>
        <span
          aria-hidden
          className={`relative h-5 w-9 rounded-full transition-colors ${
            theme === "dark" ? "bg-primary" : "bg-line"
          }`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
              theme === "dark" ? "translate-x-4.5" : "translate-x-0.5"
            }`}
          />
        </span>
      </button>
    </aside>
  );
}
