"use client";
import dynamic from "next/dynamic";
import { EnvelopeIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import FloatingClouds from "@/components/FloatingClouds";
import Image from "next/image";
import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TetrisGame from "@/components/TetrisGame";
import Header from "@/components/Header";
import * as THREE from "three";
import RINGS from "vanta/dist/vanta.rings.min";
/// <reference path="../types/vanta-net.d.ts" />
import BottomMarquee from "@/components/GreetingMarquee";
import { Canvas } from "@react-three/fiber";
import React from "react";
import { useInView } from "@/hooks/useInView";
import Link from "next/link";
import { useRouter } from 'next/navigation';

const LottieAnimation = dynamic(() => import("@/components/LottieAnimation"), { ssr: false });
const ThreeDSection = dynamic(() => import("@/components/ThreeDSection"), { ssr: false });
const Hero3DBackground = dynamic(() => import("@/components/Hero3DBackground"), { ssr: false });

const fontVars = [
  "font-syne",
  "font-space-grotesk",
  "font-rajdhani",
  "font-audiowide",
  "font-major-mono",
  "font-saira",
  "font-vt323",
  "font-rubik-mono",
  "font-bungee",
  "font-exo",
];

function FloatingSphere({ onClick }: { onClick?: () => void }) {
  const meshRef = useRef<any>(null);
  const [hovered, setHovered] = React.useState(false);
  const [shape, setShape] = React.useState<'sphere'|'box'|'torus'|'cone'|'octahedron'>('sphere');
  const [mouse, setMouse] = React.useState<{x: number, y: number} | null>(null);
  // Animate up and down
  React.useEffect(() => {
    let frame: number;
    const animate = () => {
      if (meshRef.current) {
        const t = Date.now() * 0.001;
        meshRef.current.position.y = 0.95 + Math.sin(t * 2) * 0.18;
      }
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, []);

  // Morph to random shape on hover
  const handleHover = (v: boolean) => {
    setHovered(v);
    if (v) {
      const shapes = ['sphere', 'box', 'torus', 'cone', 'octahedron'] as const;
      let next: typeof shape = shape;
      while (next === shape) {
        next = shapes[Math.floor(Math.random() * shapes.length)];
      }
      setShape(next);
    } else {
      setShape('sphere');
      setMouse(null);
    }
  };

  // Fade morph animation
  const [fade, setFade] = React.useState(false);
  React.useEffect(() => {
    if (hovered) {
      setFade(true);
      const t = setTimeout(() => setFade(false), 180);
      return () => clearTimeout(t);
    }
  }, [shape, hovered]);

  // Mouse move handler for label
  const handleMouseMove = (e: React.MouseEvent) => {
    setMouse({ x: e.clientX, y: e.clientY });
  };

  return (
    <>
      {hovered && mouse && (
        <div
          style={{
            position: 'fixed',
            left: mouse.x,
            top: mouse.y - 36,
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none',
            zIndex: 9999,
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: '0.12em',
            color: '#fff',
            textShadow: '0 2px 8px #18181b, 0 0 2px #e6c47a',
            background: 'rgba(24,24,27,0.92)',
            padding: '4px 14px',
            borderRadius: 14,
            border: '1.5px solid #e6c47a',
            fontFamily: 'Syne, Space Grotesk, sans-serif',
            textTransform: 'uppercase',
            transition: 'opacity 0.5s cubic-bezier(.4,0,.2,1)',
            opacity: fade ? 0.3 : 1,
          }}
        >
          About Me
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 'calc(50% + 60px)',
          transform: 'translate(-50%, -100%)',
          zIndex: 2,
          width: 120,
          height: 120,
          cursor: 'pointer',
          transition: 'transform 0.2s cubic-bezier(.4,0,.2,1)',
          filter: 'drop-shadow(0 4px 24px #e6c47a44)',
        }}
        title="About Me"
        onClick={onClick}
        onMouseEnter={() => handleHover(true)}
        onMouseLeave={() => handleHover(false)}
        onMouseMove={hovered ? handleMouseMove : undefined}
      >
        <Canvas
          style={{ width: '100%', height: '100%', opacity: fade ? 0.3 : 1, transition: 'opacity 0.18s' }}
          camera={{ position: [0, 0, 3.5] }}
        >
          <ambientLight intensity={0.7} />
          <directionalLight position={[2, 2, 2]} intensity={0.7} />
          <mesh
            ref={meshRef}
            castShadow
            receiveShadow
            scale={hovered ? 1.15 : 1}
          >
            {shape === 'sphere' && <sphereGeometry args={[0.7, 32, 32]} />}
            {shape === 'box' && <boxGeometry args={[1.1, 1.1, 1.1]} />}
            {shape === 'torus' && <torusGeometry args={[0.55, 0.22, 24, 48]} />}
            {shape === 'cone' && <coneGeometry args={[0.8, 1.2, 32]} />}
            {shape === 'octahedron' && <octahedronGeometry args={[0.8, 0]} />}
            <meshStandardMaterial color="#f5f5f5" metalness={0.3} roughness={0.6} transparent opacity={0.85} />
          </mesh>
        </Canvas>
        <style jsx>{`
          div[title] {
            animation: pulse 1.6s infinite cubic-bezier(.4,0,.2,1);
          }
          @keyframes pulse {
            0%, 100% { transform: translate(-50%, -100%) scale(1); }
            50% { transform: translate(-50%, -100%) scale(1.08); }
          }
        `}</style>
      </div>
    </>
  );
}

function AnimatedSection({ children }: { children: React.ReactNode }) {
  const [ref, inView] = useInView(0.2);
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, type: 'spring', bounce: 0.2 }}
      className="w-full flex justify-center items-center py-24"
    >
      {children}
    </motion.section>
  );
}

function AboutCard({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0, scale: 0.92, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 40 }}
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-xl w-full relative flex flex-col items-center"
        onClick={e => e.stopPropagation()}
        initial={{ scale: 0.98 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-black transition">✕</button>
        <img src="/headshot.png" alt="Headshot" className="w-28 h-28 rounded-full mx-auto mb-6 border-4 border-[#e6c47a] shadow-lg" />
        <h2 className="text-3xl font-extrabold mb-2 text-[#18181b] tracking-widest uppercase text-center">About Me</h2>
        <div className="w-12 h-1 bg-[#e6c47a] rounded-full mb-4 mx-auto" />
        <p className="text-base md:text-lg text-gray-700 text-center mb-4">
          West Coast based <b>UX Designer & Web Developer</b> with a background in Writing, Literature, Advertising, Media, Communications, Architecture, Photography, Video, & Design.
        </p>
        <p className="text-base md:text-lg text-gray-700 text-center mb-4">
          At an early age, I learned to love words. My creative journey has been a gradual progression of skills and wisdom building on my desire to tell stories and inspire thought. My love of technology became an extension of my creativity and now serves as a limitless tool for expression. Through Design, Art, and Language I am able to elevate others, their work and be a helpful hand towards reaching their goals.
        </p>
        <div className="flex flex-wrap gap-2 justify-center mt-4">
          <span className="px-3 py-1 rounded-full bg-[#e6c47a]/20 text-[#18181b] font-semibold text-xs">UX/UI Design</span>
          <span className="px-3 py-1 rounded-full bg-[#e6c47a]/20 text-[#18181b] font-semibold text-xs">Visual Design</span>
          <span className="px-3 py-1 rounded-full bg-[#e6c47a]/20 text-[#18181b] font-semibold text-xs">User Research</span>
          <span className="px-3 py-1 rounded-full bg-[#e6c47a]/20 text-[#18181b] font-semibold text-xs">HTML5</span>
          <span className="px-3 py-1 rounded-full bg-[#e6c47a]/20 text-[#18181b] font-semibold text-xs">CSS3</span>
          <span className="px-3 py-1 rounded-full bg-[#e6c47a]/20 text-[#18181b] font-semibold text-xs">JavaScript</span>
          <span className="px-3 py-1 rounded-full bg-[#e6c47a]/20 text-[#18181b] font-semibold text-xs">ReactJS</span>
          <span className="px-3 py-1 rounded-full bg-[#e6c47a]/20 text-[#18181b] font-semibold text-xs">APIs</span>
          <span className="px-3 py-1 rounded-full bg-[#e6c47a]/20 text-[#18181b] font-semibold text-xs">Storyboarding</span>
          <span className="px-3 py-1 rounded-full bg-[#e6c47a]/20 text-[#18181b] font-semibold text-xs">Wireframing</span>
          <span className="px-3 py-1 rounded-full bg-[#e6c47a]/20 text-[#18181b] font-semibold text-xs">Prototyping</span>
          <span className="px-3 py-1 rounded-full bg-[#e6c47a]/20 text-[#18181b] font-semibold text-xs">Creative Direction</span>
          <span className="px-3 py-1 rounded-full bg-[#e6c47a]/20 text-[#18181b] font-semibold text-xs">Brand Awareness</span>
          <span className="px-3 py-1 rounded-full bg-[#e6c47a]/20 text-[#18181b] font-semibold text-xs">Ad Campaign</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Home() {
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<any>(null);
  const [showAbout, setShowAbout] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!showAbout && !vantaEffect.current && vantaRef.current) {
      vantaEffect.current = RINGS({
        el: vantaRef.current,
        THREE,
        backgroundColor: 0x18181b,
        color: 0xe6c47a,
        ringColor: 0xf5f5f5,
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
  }, [showAbout]);

  // Open About Card
  const handleOrbClick = () => {
    setShowAbout(true);
    router.replace('/about');
  };

  // Close About Card
  const handleClose = () => {
    setShowAbout(false);
    router.replace('/');
  };

  return (
    <div ref={vantaRef} className="w-screen h-screen min-h-screen min-w-full bg-[#18181b] fixed inset-0 z-0">
      <Header />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Floating Sphere */}
        <div className="relative flex flex-col items-center">
          <div title="About Me" style={{ position: 'relative', width: 80, height: 80 }}>
            <FloatingSphere onClick={handleOrbClick} />
          </div>
        </div>
        <h1
          className="text-white text-5xl md:text-7xl font-extrabold tracking-widest uppercase text-center select-none"
          style={{ zIndex: 1, position: "relative", letterSpacing: "0.15em" }}
        >
          RYAN TANG
        </h1>
        {/* Project Buttons */}
        <div className="mt-8 flex flex-col md:flex-row gap-4 items-center">
          <motion.a
            href="#"
            whileHover={{ scale: 1.07, y: -2, boxShadow: "0 8px 32px #e6c47a55, 0 2px 8px #fff2" }}
            whileTap={{ scale: 0.96, y: 2, boxShadow: "0 2px 8px #0003" }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="px-7 py-3 rounded-full font-bold text-lg tracking-wide border-2 border-[#e6c47a]/70 shadow-2xl bg-[#18181b]/70 backdrop-blur-md text-[#f5f5f5] hover:text-[#18181b] hover:bg-[#fffbe6]/80 hover:backdrop-blur-lg focus:outline-none focus:ring-2 focus:ring-[#e6c47a] focus:ring-offset-2 relative overflow-hidden"
            style={{ boxShadow: "0 4px 18px #e6c47a33, 0 1.5px 0 #e6c47a" }}
          >
            <span className="absolute top-0 left-0 w-full h-1/2 bg-white/10 rounded-t-full pointer-events-none" style={{ filter: 'blur(2px)' }} />
            <span className="relative z-10">Development</span>
          </motion.a>
          <motion.div
            whileHover={{ scale: 1.07, y: -2, boxShadow: "0 8px 32px #e6c47a55, 0 2px 8px #fff2" }}
            whileTap={{ scale: 0.96, y: 2, boxShadow: "0 2px 8px #0003" }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
          >
            <Link
              href="/design"
              className="px-7 py-3 rounded-full font-bold text-lg tracking-wide border-2 border-[#e6c47a]/70 shadow-2xl bg-[#18181b]/70 backdrop-blur-md text-[#f5f5f5] hover:text-[#18181b] hover:bg-[#fffbe6]/80 hover:backdrop-blur-lg focus:outline-none focus:ring-2 focus:ring-[#e6c47a] focus:ring-offset-2 relative overflow-hidden"
              style={{ boxShadow: "0 4px 18px #e6c47a33, 0 1.5px 0 #e6c47a" }}
            >
              <span className="absolute top-0 left-0 w-full h-1/2 bg-white/10 rounded-t-full pointer-events-none" style={{ filter: 'blur(2px)' }} />
              <span className="relative z-10">Design</span>
            </Link>
          </motion.div>
          <motion.a
            href="#"
            whileHover={{ scale: 1.07, y: -2, boxShadow: "0 8px 32px #e6c47a55, 0 2px 8px #fff2" }}
            whileTap={{ scale: 0.96, y: 2, boxShadow: "0 2px 8px #0003" }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="px-7 py-3 rounded-full font-bold text-lg tracking-wide border-2 border-[#e6c47a]/70 shadow-2xl bg-[#18181b]/70 backdrop-blur-md text-[#f5f5f5] hover:text-[#18181b] hover:bg-[#fffbe6]/80 hover:backdrop-blur-lg focus:outline-none focus:ring-2 focus:ring-[#e6c47a] focus:ring-offset-2 relative overflow-hidden"
            style={{ boxShadow: "0 4px 18px #e6c47a33, 0 1.5px 0 #e6c47a" }}
          >
            <span className="absolute top-0 left-0 w-full h-1/2 bg-white/10 rounded-t-full pointer-events-none" style={{ filter: 'blur(2px)' }} />
            <span className="relative z-10">Retail & Ecommerce</span>
          </motion.a>
        </div>
      </div>
      <BottomMarquee />
      <AnimatePresence>
        {showAbout && (
          <AboutCard onClose={handleClose} />
        )}
      </AnimatePresence>
    </div>
  );
}
