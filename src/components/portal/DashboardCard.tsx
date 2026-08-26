import type { ReactNode } from "react";

export default function DashboardCard({
  id,
  title,
  description,
  action,
  children,
  className = "",
}: {
  id?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-24 rounded-sm border border-white/10 bg-[#121212] p-5 ${className}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-syne)] text-sm font-semibold text-white">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-xs text-white/40">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
