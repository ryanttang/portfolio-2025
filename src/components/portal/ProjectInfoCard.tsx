"use client";

import { useState } from "react";
import type { ProjectInfo } from "@/lib/portal/project-info";

function hrefFor(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
      className="text-[10px] uppercase tracking-wider text-white/40 hover:text-white/70"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function InfoRow({
  label,
  value,
  href,
  secret = false,
}: {
  label: string;
  value: string;
  href?: string;
  secret?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  if (!value.trim()) return null;

  return (
    <div className="rounded-sm border border-white/5 bg-white/[0.02] px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">{label}</p>
        <div className="flex items-center gap-3">
          {secret && (
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              className="text-[10px] uppercase tracking-wider text-white/40 hover:text-white/70"
            >
              {visible ? "Hide" : "Show"}
            </button>
          )}
          <CopyButton value={value} />
        </div>
      </div>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="mt-1.5 block break-all text-sm text-[#fdf0d5] hover:underline"
        >
          {value}
        </a>
      ) : (
        <p className={`mt-1.5 break-all text-sm ${secret && !visible ? "tracking-widest text-white/55" : "text-white/80"}`}>
          {secret && !visible ? "••••••••••••" : value}
        </p>
      )}
    </div>
  );
}

export default function ProjectInfoCard({ info }: { info: ProjectInfo }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <InfoRow label="Project URL" value={info.projectUrl} href={hrefFor(info.projectUrl)} />
      <InfoRow
        label="Client Login URL"
        value={info.clientLoginUrl}
        href={hrefFor(info.clientLoginUrl)}
      />
      <InfoRow label="Client Username" value={info.clientUsername} />
      <InfoRow label="Client Password" value={info.clientPassword} secret />
    </div>
  );
}
