"use client";

import { create } from "zustand";
import { CheckCircle2, AlertTriangle } from "lucide-react";

interface ToastState {
  message?: string;
  kind: "success" | "error";
  show(message: string, kind?: "success" | "error"): void;
  clear(): void;
}

export const useToast = create<ToastState>()((set) => ({
  message: undefined,
  kind: "success",
  show(message, kind = "success") {
    set({ message, kind });
    window.setTimeout(() => set({ message: undefined }), 3500);
  },
  clear: () => set({ message: undefined }),
}));

export function ToastViewport() {
  const { message, kind } = useToast();
  if (!message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-line bg-card-raised px-4 py-3 text-sm shadow-lg lg:bottom-8"
    >
      {kind === "success" ? (
        <CheckCircle2 size={18} className="text-success" aria-hidden />
      ) : (
        <AlertTriangle size={18} className="text-danger" aria-hidden />
      )}
      {message}
    </div>
  );
}
