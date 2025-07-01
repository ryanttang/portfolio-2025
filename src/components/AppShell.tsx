"use client";
import React, { useState, useEffect } from "react";
import LoadingScreen from "./LoadingScreen";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1600);
    return () => clearTimeout(timer);
  }, []);
  return (
    <>
      <LoadingScreen show={loading} />
      <div style={{ opacity: loading ? 0 : 1, transition: 'opacity 0.5s' }}>
        {children}
      </div>
    </>
  );
} 