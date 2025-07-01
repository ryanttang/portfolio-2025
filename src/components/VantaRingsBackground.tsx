"use client";
import { useEffect, useRef } from "react";
import RINGS from "vanta/dist/vanta.rings.min";
import * as THREE from "three";

export default function VantaRingsBackground({ className = "", style = {}, zIndex = 1, shouldInit = true }: { className?: string; style?: React.CSSProperties; zIndex?: number; shouldInit?: boolean }) {
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<any>(null);

  useEffect(() => {
    if (!shouldInit) {
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
      return;
    }
    if (!vantaEffect.current && vantaRef.current) {
      vantaEffect.current = RINGS({
        el: vantaRef.current,
        THREE,
        backgroundColor: 0x18181b,
        color: 0xffffff,
        ringColor: 0xe0e0e0,
        shadowColor: 0x232323,
        speed: 0.8,
        spacing: 18.0,
      });
    }
    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
    };
  }, [shouldInit]);

  return (
    <div
      ref={vantaRef}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex,
        ...style,
      }}
    />
  );
} 