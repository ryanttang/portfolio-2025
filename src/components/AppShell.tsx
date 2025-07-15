"use client";
import React, { useState, useEffect, useRef } from "react";
import LoadingScreen from "./LoadingScreen";
import VantaRingsBackground from "./VantaRingsBackground";

export default function AppShell({ children }: { children: React.ReactNode }) {
  // Use a ref to persist loading state across navigations
  const hasLoadedRef = useRef(false);
  const [loading, setLoading] = useState(() => !hasLoadedRef.current);

  useEffect(() => {
    if (!hasLoadedRef.current) {
      const timer = setTimeout(() => {
        setLoading(false);
        hasLoadedRef.current = true;
      }, 1600);
    return () => clearTimeout(timer);
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, width: '100vw', height: '100vh', pointerEvents: 'none' }}>
        <VantaRingsBackground zIndex={1} />
      </div>
      <LoadingScreen show={loading} />
      <div style={{ opacity: loading ? 0 : 1, transition: 'opacity 0.5s', position: 'relative', zIndex: 10 }}>
        {children}
      </div>
    </>
  );
} 