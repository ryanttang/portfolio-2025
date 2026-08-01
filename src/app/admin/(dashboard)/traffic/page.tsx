import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/db";

async function queryTraffic(days: number) {
  try {
    const byPath = await db.execute<{ path: string; views: number }>(sql`
      SELECT path, count(*)::int AS views
      FROM page_events
      WHERE created_at >= now() - (${days} || ' days')::interval
      GROUP BY path
      ORDER BY views DESC
      LIMIT 25
    `);
    const byReferrer = await db.execute<{ referrer: string; views: number }>(sql`
      SELECT coalesce(nullif(referrer, ''), '(direct)') AS referrer, count(*)::int AS views
      FROM page_events
      WHERE created_at >= now() - (${days} || ' days')::interval
      GROUP BY 1
      ORDER BY views DESC
      LIMIT 15
    `);
    const totals = await db.execute<{ views: number }>(sql`
      SELECT count(*)::int AS views
      FROM page_events
      WHERE created_at >= now() - (${days} || ' days')::interval
    `);

    const pathRows = Array.isArray(byPath) ? byPath : (byPath as { rows?: { path: string; views: number }[] }).rows || [];
    const refRows = Array.isArray(byReferrer)
      ? byReferrer
      : (byReferrer as { rows?: { referrer: string; views: number }[] }).rows || [];
    const totalRows = Array.isArray(totals)
      ? totals
      : (totals as { rows?: { views: number }[] }).rows || [];

    return {
      byPath: pathRows as { path: string; views: number }[],
      byReferrer: refRows as { referrer: string; views: number }[],
      total: (totalRows[0] as { views: number } | undefined)?.views ?? 0,
    };
  } catch {
    return { byPath: [], byReferrer: [], total: 0 };
  }
}

export default async function TrafficPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const sp = await searchParams;
  const days = sp.days === "7" ? 7 : 30;
  const data = await queryTraffic(days);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold">Traffic</h1>
          <p className="mt-1 text-sm text-white/50">First-party pageviews (last {days} days).</p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link
            href="/admin/traffic?days=7"
            className={`px-3 py-1.5 ${days === 7 ? "bg-white/10 text-[#fdf0d5]" : "text-white/50"}`}
          >
            7 days
          </Link>
          <Link
            href="/admin/traffic?days=30"
            className={`px-3 py-1.5 ${days === 30 ? "bg-white/10 text-[#fdf0d5]" : "text-white/50"}`}
          >
            30 days
          </Link>
        </div>
      </div>

      <p className="mt-6 font-[family-name:var(--font-syne)] text-4xl font-bold text-[#fdf0d5]">
        {data.total}
        <span className="ml-2 text-sm font-normal text-white/40">pageviews</span>
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Table title="Top paths" rows={data.byPath.map((r) => [r.path, r.views])} />
        <Table title="Top referrers" rows={data.byReferrer.map((r) => [r.referrer, r.views])} />
      </div>
    </div>
  );
}

function Table({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <div className="border border-white/10 bg-[#141414]">
      <h2 className="border-b border-white/10 px-4 py-3 text-sm font-semibold">{title}</h2>
      <ul className="divide-y divide-white/5">
        {rows.length === 0 && (
          <li className="px-4 py-6 text-sm text-white/40">No data yet.</li>
        )}
        {rows.map(([label, views]) => (
          <li key={label} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
            <span className="truncate text-white/80">{label}</span>
            <span className="shrink-0 text-[#fdf0d5]">{views}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
