"use client";

interface TabsProps<T extends string> {
  tabs: { id: T; label: string }[];
  value: T;
  onChange(id: T): void;
}

export function Tabs<T extends string>({ tabs, value, onChange }: TabsProps<T>) {
  return (
    <div role="tablist" aria-label="Statistikflikar" className="mb-6 flex gap-1 rounded-xl border border-line bg-card p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          type="button"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            value === tab.id
              ? "bg-primary text-white"
              : "text-ink-muted hover:bg-card-raised hover:text-ink"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
