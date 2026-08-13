import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { money, pct, toneClass } from "@/lib/format";

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("panel p-5 lg:p-6", className)}>{children}</section>;
}

export function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: ReactNode;
  tone?: number;
}) {
  return (
    <Panel>
      <p className="label-eyebrow">{label}</p>
      <p
        className={cn(
          "num mt-2 text-2xl lg:text-[1.75rem]",
          tone !== undefined ? toneClass(tone) : "",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Panel>
  );
}

export function PerfPair({
  value,
  percent,
  currency = "EUR",
}: {
  value: number;
  percent: number;
  currency?: string;
}) {
  return (
    <span className={cn("num", toneClass(value))}>
      {value >= 0 ? "+" : "−"}
      {money(Math.abs(value), currency)} <span className="opacity-70">({pct(percent)})</span>
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Panel className="flex flex-col items-center gap-3 py-14 text-center">
      <h2 className="text-2xl">{title}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-2 flex flex-wrap justify-center gap-2">{action}</div>}
    </Panel>
  );
}
