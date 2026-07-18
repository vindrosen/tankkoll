"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Huvudmeny"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex">
        {NAV_ITEMS.map(({ href, label, shortLabel, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  active ? "text-primary" : "text-ink-faint hover:text-ink-muted"
                }`}
              >
                <Icon size={20} aria-hidden />
                {shortLabel ?? label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
