const CURRENCY_SUFFIX: Record<string, string> = {
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  EUR: "€",
};

export function formatNumber(n: number, decimals = 0): string {
  return new Intl.NumberFormat("sv-SE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

export function formatCurrency(n: number, currency: string, decimals = 0): string {
  const suffix = CURRENCY_SUFFIX[currency] ?? currency;
  return `${formatNumber(n, decimals)} ${suffix}`;
}

export function currencySuffix(currency: string): string {
  return CURRENCY_SUFFIX[currency] ?? currency;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatDateShort(iso: string): string {
  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "short",
  }).format(new Date(iso)).replace(".", "");
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
