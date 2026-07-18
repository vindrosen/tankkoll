export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border border-line bg-card p-5 shadow-sm shadow-black/10 ${className}`}
    >
      {children}
    </section>
  );
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 text-sm font-semibold text-ink-muted">{children}</h2>;
}
