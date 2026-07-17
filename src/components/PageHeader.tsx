"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

interface PageHeaderProps {
  title: string;
  showNewRefueling?: boolean;
  children?: React.ReactNode;
}

export function PageHeader({ title, showNewRefueling = false, children }: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      <div className="flex items-center gap-3">
        {children}
        {showNewRefueling && (
          <Link
            href="/tankning"
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary-deep"
          >
            <Plus size={16} aria-hidden />
            Ny tankning
          </Link>
        )}
      </div>
    </div>
  );
}
