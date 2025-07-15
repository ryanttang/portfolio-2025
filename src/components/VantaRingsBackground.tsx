"use client";
import { useEffect, useRef } from "react";
// Vanta will be loaded dynamically
import * as THREE from "three";



type VantaRingsBackgroundProps = {
  className?: string;
  style?: React.CSSProperties;
  zIndex?: number;
  shouldInit?: boolean;
};

export default function VantaRingsBackground({ className = "", style = {}, zIndex = 1, shouldInit = true }: VantaRingsBackgroundProps) {
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<unknown>(null);

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;
    function initVanta() {
      if (!shouldInit || !vantaRef.current || vantaEffect.current) return;
      if (vantaRef.current.offsetWidth === 0 || vantaRef.current.offsetHeight === 0) {
        // Try again after a short delay if the element is not visible yet
        timeout = setTimeout(initVanta, 100);
        return;
      }
      const opts = {
        el: vantaRef.current,
        THREE,
        backgroundColor: 0x18181b,
        color: 0xe6c47a, // static gold
        ringColor: 0xf5f5f5, // static white
        shadowColor: 0x232323, // static dark
        speed: 0.8,
        spacing: 18.0,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
      };
      // Use global VANTA object
      if (typeof window !== 'undefined' && window.VANTA && window.VANTA.RINGS) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          vantaEffect.current = window.VANTA.RINGS(opts as any);
        } catch (e) {
          console.error('VantaRings initialization error:', e, opts);
          if (vantaEffect.current) {
            (vantaEffect.current as { destroy: () => void }).destroy();
            vantaEffect.current = null;
          }
        }
      } else {
        console.error('VANTA.RINGS not available');
      }
    }
    if (shouldInit) {
      initVanta();
    } else if (vantaEffect.current) {
      (vantaEffect.current as { destroy: () => void }).destroy();
      vantaEffect.current = null;
    }
    return () => {
      if (timeout) clearTimeout(timeout);
      if (vantaEffect.current) {
        (vantaEffect.current as { destroy: () => void }).destroy();
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