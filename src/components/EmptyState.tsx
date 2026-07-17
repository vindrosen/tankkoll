"use client";

import Link from "next/link";
import { asset } from "@/lib/asset";

interface EmptyStateProps {
  image: "tankningar" | "bilar";
  title: string;
  body: string;
  ctaHref?: string;
  ctaLabel?: string;
}

export function EmptyState({ image, title, body, ctaHref, ctaLabel }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-line bg-card px-6 py-12 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset(`/images/empty-${image}.webp`)}
        alt=""
        width={160}
        height={160}
        loading="lazy"
      />
      <h2 className="mt-4 text-lg font-bold">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-ink-muted">{body}</p>
      {ctaHref && ctaLabel && (
        <Link
          href={ctaHref}
          className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-deep"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
