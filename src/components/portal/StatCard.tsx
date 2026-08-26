import Link from "next/link";
import type { ReactNode } from "react";

export default function StatCard({
  label,
  value,
  hint,
  href,
  accent = false,
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  accent?: boolean;
  icon?: ReactNode;
}) {
  const content = (
    <div
      className={`h-full rounded-sm border p-4 transition ${
        accent
          ? "border-[#fdf0d5]/30 bg-[#fdf0d5]/5 hover:border-[#fdf0d5]/50"
          : "border-white/10 bg-[#121212] hover:border-white/20"
      } ${href ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">{label}</p>
        {icon && <span className="text-white/25">{icon}</span>}
      </div>
      <p className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold tabular-nums">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-white/45">{hint}</p>}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    );
  }

  return content;
}
