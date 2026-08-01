"use client";
import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import LoadingScreen from "./LoadingScreen";
import VantaRingsBackground from "./VantaRingsBackground";

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isBare =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/portal") ||
    pathname?.startsWith("/sign") ||
    pathname?.startsWith("/pay");
  const showMotionBg =
    !isBare && pathname !== "/services" && pathname !== "/hello";
  // Use a ref to persist loading state across navigations
  const hasLoadedRef = useRef(false);
  const [loading, setLoading] = useState(() => !isBare && !hasLoadedRef.current);

  useEffect(() => {
    if (isBare) {
      setLoading(false);
      return;
    }
    if (!hasLoadedRef.current) {
      const timer = setTimeout(() => {
        setLoading(false);
        hasLoadedRef.current = true;
      }, 1600);
      return () => clearTimeout(timer);
    } else {
      setLoading(false);
    }
  }, [isBare]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "`" || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (isTypingTarget(e.target)) return;
      if (pathname?.startsWith("/admin")) return;
      e.preventDefault();
      router.push("/admin/login");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pathname, router]);

  if (isBare) {
    return <>{children}</>;
  }

  return (
    <>
      {showMotionBg && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, width: '100vw', height: '100vh', pointerEvents: 'none' }}>
          <VantaRingsBackground zIndex={1} />
        </div>
      )}
      <LoadingScreen show={loading} />
      <div style={{ opacity: loading ? 0 : 1, transition: 'opacity 0.5s', position: 'relative', zIndex: 10 }}>
        {children}
      </div>
    </>
  );
}
