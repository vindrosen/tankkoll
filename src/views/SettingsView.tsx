"use client";

import { useRef, useState } from "react";
import { Download, FileUp, Moon, RotateCcw } from "lucide-react";
import { Card, CardTitle } from "@/components/Card";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/components/Toast";
import { enrichRefuelings } from "@/lib/calculations";
import { parseImport, toCSV, toJSON } from "@/lib/export";
import { todayISO } from "@/lib/format";
import type { AppData } from "@/lib/types";
import { useActiveVehicle, useAppStore } from "@/store/useAppStore";

const CURRENCIES = [
  { code: "SEK", label: "Svenska kronor (kr)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "NOK", label: "Norska kronor (kr)" },
  { code: "DKK", label: "Danska kronor (kr)" },
];

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SettingsView() {
  const hydrated = useAppStore((s) => s.hydrated);
  const settings = useAppStore((s) => s.settings);
  const vehicles = useAppStore((s) => s.vehicles);
  const refuelings = useAppStore((s) => s.refuelings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const importData = useAppStore((s) => s.importData);
  const resetAll = useAppStore((s) => s.resetAll);
  const activeVehicle = useActiveVehicle();
  const show = useToast((s) => s.show);

  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<AppData>();
  const [resetStep, setResetStep] = useState(0);

  if (!hydrated) {
    return <div aria-busy="true" className="h-96 animate-pulse rounded-2xl bg-card" />;
  }

  function exportJSON() {
    const data: AppData = { version: 1, vehicles, refuelings, settings };
    download(`tankkoll-export-${todayISO()}.json`, toJSON(data), "application/json");
    show("JSON-exporten laddas ner");
  }

  function exportCSV() {
    const list = activeVehicle
      ? refuelings.filter((r) => r.vehicleId === activeVehicle.id)
      : refuelings;
    download(
      `tankkoll-tankningar-${todayISO()}.csv`,
      toCSV(enrichRefuelings(list), vehicles),
      "text/csv;charset=utf-8",
    );
    show("CSV-exporten laddas ner");
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setPendingImport(parseImport(await file.text()));
    } catch (err) {
      show(err instanceof Error ? err.message : "Filen kunde inte läsas.", "error");
    }
  }

  const buttonClass =
    "flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-card-raised";

  return (
    <>
      <PageHeader title="Inställningar" />
      <div className="mx-auto max-w-2xl space-y-4">
        <Card>
          <CardTitle>Utseende</CardTitle>
          <label className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-3">
              <Moon size={18} className="text-ink-faint" aria-hidden />
              Mörkt läge
            </span>
            <input
              type="checkbox"
              checked={settings.theme === "dark"}
              onChange={(e) =>
                void updateSettings({ theme: e.target.checked ? "dark" : "light" })
              }
              className="h-5 w-5 accent-[#2563eb]"
            />
          </label>
        </Card>

        <Card>
          <CardTitle>Valuta</CardTitle>
          <label htmlFor="currency" className="sr-only">
            Valuta
          </label>
          <select
            id="currency"
            value={settings.currency}
            onChange={(e) => void updateSettings({ currency: e.target.value })}
            className="w-full rounded-xl border border-line bg-card-raised px-4 py-3 text-sm text-ink"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </Card>

        <Card>
          <CardTitle>Data</CardTitle>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={exportJSON} className={buttonClass}>
              <Download size={16} aria-hidden />
              Exportera JSON
            </button>
            <button type="button" onClick={exportCSV} className={buttonClass}>
              <Download size={16} aria-hidden />
              Exportera CSV
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={buttonClass}
            >
              <FileUp size={16} aria-hidden />
              Importera JSON
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              onChange={(e) => void handleFile(e)}
              className="hidden"
              aria-label="Välj JSON-fil att importera"
            />
          </div>
          <p className="mt-3 text-xs text-ink-faint">
            All data sparas bara i din webbläsare. Exportera regelbundet om du vill ha en
            säkerhetskopia eller flytta till en annan enhet.
          </p>
        </Card>

        <Card>
          <CardTitle>Farozon</CardTitle>
          <button
            type="button"
            onClick={() => setResetStep(1)}
            className="flex items-center gap-2 rounded-xl border border-danger/40 px-4 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
          >
            <RotateCcw size={16} aria-hidden />
            Återställ all data
          </button>
        </Card>

        <Card>
          <CardTitle>Om TankKoll</CardTitle>
          <p className="text-sm text-ink-muted">
            TankKoll v1.0 – en gratis bränsledagbok som hjälper dig förstå bilens verkliga
            förbrukning. Byggd av{" "}
            <a
              href="https://erlandsson.online"
              className="text-primary hover:underline"
              rel="noopener"
            >
              erlandsson.online
            </a>
            .
          </p>
        </Card>
      </div>

      <ConfirmDialog
        open={pendingImport !== undefined}
        title="Importera data?"
        body={`Importen innehåller ${pendingImport?.vehicles.length ?? 0} bilar och ${
          pendingImport?.refuelings.length ?? 0
        } tankningar. All nuvarande data ersätts.`}
        confirmLabel="Importera"
        onCancel={() => setPendingImport(undefined)}
        onConfirm={() => {
          if (pendingImport) {
            void importData(pendingImport);
            show("Datan importerad");
          }
          setPendingImport(undefined);
        }}
      />

      <ConfirmDialog
        open={resetStep === 1}
        title="Återställ all data?"
        body="Alla bilar, tankningar och inställningar tas bort från den här webbläsaren."
        confirmLabel="Fortsätt"
        danger
        onCancel={() => setResetStep(0)}
        onConfirm={() => setResetStep(2)}
      />
      <ConfirmDialog
        open={resetStep === 2}
        title="Är du helt säker?"
        body="Detta går inte att ångra. Exportera först om du vill kunna komma tillbaka."
        confirmLabel="Ja, radera allt"
        danger
        onCancel={() => setResetStep(0)}
        onConfirm={() => {
          void resetAll();
          show("All data har återställts");
          setResetStep(0);
        }}
      />
    </>
  );
}
