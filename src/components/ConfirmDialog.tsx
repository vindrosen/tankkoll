"use client";

import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm(): void;
  onCancel(): void;
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onCancel}
      onCancel={onCancel}
      aria-labelledby="confirm-title"
      className="m-auto w-[min(92vw,26rem)] rounded-2xl border border-line bg-card p-6 text-ink shadow-xl backdrop:bg-black/60"
    >
      <h2 id="confirm-title" className="text-lg font-bold">
        {title}
      </h2>
      <p className="mt-2 text-sm text-ink-muted">{body}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-card-raised hover:text-ink"
        >
          Avbryt
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors ${
            danger ? "bg-danger hover:bg-danger/85" : "bg-primary hover:bg-primary-deep"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
