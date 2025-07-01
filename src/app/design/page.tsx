"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import VantaRingsBackground from "@/components/VantaRingsBackground";
import { motion } from "framer-motion";

export default function DesignPage() {
  const [vantaReady, setVantaReady] = useState(false);
  const router = useRouter();
  // Placeholder images for now
  const images = [
    "/cloud1.svg",
    "/cloud2.svg",
    "/cloud3.svg",
    "/globe.svg",
    "/window.svg",
    "/file.svg",
    "/next.svg",
    "/vercel.svg",
  ];
  const handleClose = () => {
    router.replace("/");
  };
  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.92, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, x: -120 }}
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      onClick={handleClose}
      style={{ background: 'rgba(24,24,27,0.60)', backdropFilter: 'blur(6px)' }}
      onAnimationComplete={() => setVantaReady(true)}
    >
      <VantaRingsBackground zIndex={1} shouldInit={vantaReady} />
      <motion.div
        className="bg-white rounded-3xl shadow-2xl p-6 md:p-10 max-w-4xl w-full relative flex flex-col items-center"
        onClick={e => e.stopPropagation()}
        initial={{ scale: 0.98 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.98, x: -120, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        style={{ zIndex: 2 }}
      >
        <button onClick={handleClose} className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-black transition">✕</button>
        <h2 className="text-3xl font-extrabold mb-2 text-[#18181b] tracking-widest uppercase text-center">Visual Design: Graphics</h2>
        <div className="w-12 h-1 bg-[#e6c47a] rounded-full mb-4 mx-auto" />
        {/* Masonry Grid */}
        <div className="columns-2 md:columns-3 gap-4 w-full max-h-[60vh] overflow-y-auto">
          {images.map((src, i) => (
            <div key={i} className="mb-4 break-inside-avoid rounded-xl overflow-hidden shadow-lg bg-[#f5f5f5]">
              <img src={src} alt="Design graphic" className="w-full h-auto object-cover" />
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
} 