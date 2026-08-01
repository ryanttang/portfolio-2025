"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function getSessionId() {
  if (typeof window === "undefined") return null;
  const key = "rt_pv_sid";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(key, id);
  }
  return id;
}

export default function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    const path = searchParams?.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;
    void fetch("/api/analytics/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path,
        referrer: document.referrer || null,
        sessionId: getSessionId(),
      }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname, searchParams]);

  return null;
}
