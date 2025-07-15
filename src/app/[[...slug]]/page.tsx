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
import { BottomMarquee } from "@/components/GreetingMarquee";
import { Canvas } from "@react-three/fiber";
import React from "react";
import { useInView } from "@/hooks/useInView";
import Link from "next/link";
import { useRouter, usePathname, useParams } from 'next/navigation';
import VantaRingsBackground from "@/components/VantaRingsBackground";
import { FaLinkedin, FaGithub, FaEnvelope, FaFileAlt } from "react-icons/fa";
import { useSpring, a } from '@react-spring/three';

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
  const [rotation, setRotation] = useState(0);
  const [gradient, setGradient] = useState([
    '#e6c47a', '#00c3ff', '#f5f5f5', '#232323', '#ff6f61', '#6a82fb', '#fc5c7d', '#43cea2', '#185a9d', '#f7971e'
  ]);
  const [gradientIdx, setGradientIdx] = useState(0);
  const [color, setColor] = useState(gradient[0]);

  // Animate color with @react-spring/three
  const spring = useSpring({
    color: color,
    config: { mass: 1, tension: 120, friction: 20 },
  });

  // Animate up/down and rotation
  useEffect(() => {
    let frame: number;
    const animate = () => {
      if (meshRef.current) {
        const t = Date.now() * 0.001;
        meshRef.current.position.y = 0.95 + Math.sin(t * 2) * 0.18;
        meshRef.current.rotation.y = t * 0.5; // slow rotation
      }
      setRotation(r => r + 0.01);
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, []);

  // Change gradient every 2.5s
  useEffect(() => {
    const interval = setInterval(() => {
      setGradientIdx(idx => {
        const nextIdx = (idx + 1) % gradient.length;
        setColor(gradient[nextIdx]);
        return nextIdx;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [gradient.length, gradient]);

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
  useEffect(() => {
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

  // Responsive orb size - handle SSR
  const [orbSize, setOrbSize] = useState(120); // Default size for SSR
  
  useEffect(() => {
    // Set responsive size after component mounts (client-side only)
    const updateOrbSize = () => {
      const newSize = Math.min(144, Math.max(80, window.innerWidth * 0.15));
      setOrbSize(newSize);
    };
    
    updateOrbSize();
    window.addEventListener('resize', updateOrbSize);
    
    return () => window.removeEventListener('resize', updateOrbSize);
  }, []);

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
            fontSize: 'clamp(12px, 2.5vw, 14px)',
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
          width: orbSize,
          height: orbSize,
          cursor: 'pointer',
          transition: 'transform 0.2s cubic-bezier(.4,0,.2,1)',
          filter: 'drop-shadow(0 0 32px #e6c47a88) drop-shadow(0 0 16px #00c3ff88)', // subtle gold and blue glow
          // Removed boxShadow to eliminate border/outline
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
          <ambientLight intensity={1.2} />
          <directionalLight position={[2, 2, 2]} intensity={1.4} />
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
            <a.meshStandardMaterial
              attach="material"
              color={spring.color}
              metalness={0.3}
              roughness={0.6}
              transparent
              opacity={0.85}
            />
          </mesh>
        </Canvas>
        <style jsx>{`
          div[title] {
            animation: pulse 1.6s infinite cubic-bezier(.4,0,.2,1);
          }
          @keyframes pulse {
            0%, 100% { transform: translate(-50%, -100%) scale(1); }
            50% { transform: translate(-50%, -100%) scale(1.04); }
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
      className="w-full flex justify-center items-center py-12 sm:py-16 md:py-24"
    >
      {children}
    </motion.section>
  );
}

function AboutCard({ onClose }: { onClose: () => void }) {
  const [vantaReady, setVantaReady] = useState(false);
  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.92, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, x: -120 }}
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      onClick={onClose}
      style={{ background: 'rgba(24,24,27,0.60)', backdropFilter: 'blur(6px)' }}
      onAnimationComplete={() => setVantaReady(true)}
    >
      <motion.div
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 md:p-12 max-w-full sm:max-w-xl w-full relative flex flex-col items-center"
        onClick={e => e.stopPropagation()}
        initial={{ scale: 0.98 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.98, x: -120, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        style={{ zIndex: 2 }}
      >
        <button onClick={onClose} className="absolute top-2 sm:top-4 right-2 sm:right-4 text-xl sm:text-2xl text-gray-400 hover:text-black transition">✕</button>
        <img src="/headshot.png" alt="Headshot" className="w-20 h-20 sm:w-28 sm:h-28 rounded-full mx-auto mb-4 sm:mb-6 border-4 border-[#e6c47a] shadow-lg" />
        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold mb-2 text-[#18181b] tracking-widest uppercase text-center">About Me</h2>
        <div className="w-12 h-1 bg-[#e6c47a] rounded-full mb-4 mx-auto" />
        <p className="text-sm sm:text-base md:text-lg text-gray-700 text-center mb-4 px-2">
          West Coast based <b>UX Designer & Web Developer</b> with a background in Writing, Literature, Advertising, Media, Communications, Architecture, Photography, Video, & Design.
        </p>
        <p className="text-sm sm:text-base md:text-lg text-gray-700 text-center mb-4 px-2">
          At an early age, I learned to love words. My creative journey has been a gradual progression of skills and wisdom building on my desire to tell stories and inspire thought. My love of technology became an extension of my creativity and now serves as a limitless tool for expression. Through Design, Art, and Language I am able to elevate others, their work and be a helpful hand towards reaching their goals.
        </p>
        <div className="flex flex-wrap gap-1 sm:gap-2 justify-center mt-4 px-2">
          <span className="px-2 sm:px-3 py-1 rounded-full bg-[#e6c47a]/20 text-[#18181b] font-semibold text-xs">UX/UI Design</span>
          <span className="px-2 sm:px-3 py-1 rounded-full bg-[#e6c47a]/20 text-[#18181b] font-semibold text-xs">Visual Design</span>
          <span className="px-2 sm:px-3 py-1 rounded-full bg-[#e6c47a]/20 text-[#18181b] font-semibold text-xs">User Research</span>
          <span className="px-2 sm:px-3 py-1 rounded-full bg-[#e6c47a]/20 text-[#18181b] font-semibold text-xs">HTML5</span>
          <span className="px-2 sm:px-3 py-1 rounded-full bg-[#e6c47a]/20 text-[#18181b] font-semibold text-xs">CSS3</span>
          <span className="px-2 sm:px-3 py-1 rounded-full bg-[#e6c47a]/20 text-[#18181b] font-semibold text-xs">JavaScript</span>
          <span className="px-2 sm:px-3 py-1 rounded-full bg-[#e6c47a]/20 text-[#18181b] font-semibold text-xs">ReactJS</span>
          <span className="px-2 sm:px-3 py-1 rounded-full bg-[#e6c47a]/20 text-[#18181b] font-semibold text-xs">APIs</span>
          <span className="px-2 sm:px-3 py-1 rounded-full bg-[#e6c47a]/20 text-[#18181b] font-semibold text-xs">Storyboarding</span>
          <span className="px-2 sm:px-3 py-1 rounded-full bg-[#e6c47a]/20 text-[#18181b] font-semibold text-xs">Wireframing</span>
          <span className="px-2 sm:px-3 py-1 rounded-full bg-[#e6c47a]/20 text-[#18181b] font-semibold text-xs">Prototyping</span>
          <span className="px-2 sm:px-3 py-1 rounded-full bg-[#e6c47a]/20 text-[#18181b] font-semibold text-xs">Creative Direction</span>
          <span className="px-2 sm:px-3 py-1 rounded-full bg-[#e6c47a]/20 text-[#18181b] font-semibold text-xs">Brand Awareness</span>
          <span className="px-2 sm:px-3 py-1 rounded-full bg-[#e6c47a]/20 text-[#18181b] font-semibold text-xs">Ad Campaign</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Home() {
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<any>(null);
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  // slug is an array or undefined
  const slug = params?.slug as string[] | undefined;
  const modalType = slug && slug[0] ? slug[0] : null;

  // Add state for Development modal
  const [showDevModal, setShowDevModal] = useState(false);
  const handleDevClick = () => setShowDevModal(true);
  const handleDevModalClose = () => setShowDevModal(false);

  // Add state for Retail & Ecommerce modal
  const [showRetailModal, setShowRetailModal] = useState(false);
  const handleRetailClick = () => setShowRetailModal(true);
  const handleRetailModalClose = () => setShowRetailModal(false);

  // Tetris modal state
  const [showTetris, setShowTetris] = useState(false);
  const handleTetrisOpen = () => setShowTetris(true);
  const handleTetrisClose = () => setShowTetris(false);

  // Tetris block color state for button
  const tetrisBlocks = ['🟦','🟩','🟧','🟥','🟨','🟪','🟫'];
  const [block, setBlock] = useState('🟪');
  const [hover, setHover] = useState(false);
  const randomizeBlock = () => {
    const idx = Math.floor(Math.random() * tetrisBlocks.length);
    setBlock(tetrisBlocks[idx]);
  };

  useEffect(() => {
    // Always clean up previous Vanta instance
    if (vantaEffect.current) {
      vantaEffect.current.destroy();
      vantaEffect.current = null;
    }
    // Only initialize if modal is NOT open
    if ((!modalType || modalType === '') && vantaRef.current) {
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
    // Always clean up on unmount
    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
    };
  }, [modalType]);

  // Open About Card
  const handleOrbClick = () => {
    router.push('/about');
  };

  // Open Design Modal
  const handleDesignClick = () => {
    router.push('/design');
  };

  // Modal close handlers
  const handleAboutClose = () => {
    router.replace('/');
  };
  const handleDesignClose = () => {
    router.replace('/');
  };

  // 1. RYANTANG heading: solid white, larger, 3D effect
  const headingStyle = {
    color: '#fff',
    textShadow: '0 4px 32px #232323cc, 0 1.5px 0 #e6c47a, 0 0.5px 0 #00c3ff',
    zIndex: 1,
    letterSpacing: '0.15em',
    lineHeight: 1.1,
    fontSize: 'var(--hero-font-size, clamp(2.5rem, 8vw, 7rem))',
    fontWeight: 900,
  };

  const headingVariants = {
    initial: { scale: 1, rotate: 0 },
    animate: { scale: 1, rotate: 0, transition: { type: 'spring' as const, stiffness: 200, damping: 20 } },
    hover: { scale: 1.03, y: -4, textShadow: '0 8px 48px #e6c47a99, 0 2px 0 #00c3ff', transition: { duration: 0.3 } },
  };

  // 2. Button style: 3D look as default, glow and enlarge on hover
  const buttonVariants = {
    initial: { y: 40, opacity: 0, scale: 0.96 },
    animate: (custom: number) => ({
      y: 0, opacity: 1, scale: 1,
      transition: { delay: 0.2 + custom * 0.08, type: 'spring' as const, stiffness: 320, damping: 24 },
    }),
    hover: {
      scale: 1.09,
      boxShadow: '0 0 0 8px #e6c47a44, 0 8px 32px #00c3ff33, 0 2px 8px #fff2, 0 4px 18px #e6c47a99',
      borderColor: '#e6c47a',
      background: 'linear-gradient(90deg, #232323 60%, #e6c47a22 100%)',
      transition: { duration: 0.18 },
    },
    tap: { scale: 0.97, boxShadow: '0 2px 8px #0003' },
  };

  return (
    <div className="w-screen h-screen min-h-screen min-w-full bg-[#18181b] fixed inset-0 z-0">
      <VantaRingsBackground zIndex={1} />
      <Header />
      {/* Play Tetris Button - fixed bottom right, circular and unique style */}
      <button
        onClick={handleTetrisOpen}
        className="fixed bottom-20 right-2 sm:bottom-24 sm:right-8 z-[200] w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#18181b] border-4 border-[#e6c47a] flex items-center justify-center shadow-xl hover:bg-[#e6c47a] hover:text-black transition group"
        style={{ boxShadow: '0 4px 24px #e6c47a55', fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', cursor: 'pointer' }}
        title="Play Tetris!"
        onMouseEnter={() => { setHover(true); randomizeBlock(); }}
        onMouseLeave={() => setHover(false)}
      >
        {/* Tooltip above button on hover */}
        {hover && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: '110%',
              transform: 'translateX(-50%)',
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
              opacity: hover ? 1 : 0,
              whiteSpace: 'pre-line',
            }}
          >
            Play<br />Tetris!
          </div>
        )}
        <span className="transition group-hover:scale-110 flex items-center justify-center w-full h-full" role="img" aria-label="Tetris" style={{fontSize:'clamp(1.5rem, 4vw, 2.2rem)'}}>{block}</span>
      </button>
      {/* Tetris Modal Overlay */}
      {showTetris && (
        <div className="fixed inset-0 z-[30000] flex items-center justify-center bg-black/80 p-4" onClick={handleTetrisClose}>
          <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 max-w-full sm:max-w-2xl w-full flex flex-col items-center overflow-y-auto" style={{ maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <button onClick={handleTetrisClose} className="absolute top-2 sm:top-4 right-2 sm:right-4 text-xl sm:text-2xl text-gray-400 hover:text-black transition">✕</button>
            <h2 className="text-xl sm:text-2xl font-extrabold mb-2 text-[#18181b] tracking-widest uppercase text-center">Play Tetris</h2>
            <div className="w-full flex justify-center items-center mt-4 mb-2">
              <TetrisGame />
            </div>
          </div>
        </div>
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        {/* Floating Sphere */}
        <div className="relative flex flex-col items-center">
          <div title="About Me" style={{ position: 'relative', width: 80, height: 80 }}>
            <FloatingSphere onClick={handleOrbClick} />
          </div>
        </div>
        <motion.h1
          className="hero-heading text-white font-extrabold uppercase text-center select-none relative px-4"
          style={{
            ...headingStyle,
            letterSpacing: '0.02em',
            lineHeight: 1.05,
          }}
          variants={headingVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
        >
          <span style={{ display: 'block', marginBottom: '5px' }}>RYAN</span>
          <span style={{ display: 'block', marginTop: 0 }}>TANG</span>
                      <style jsx>{`
              :global(.hero-heading) {
                --hero-font-size: clamp(2.5rem, 8vw, 7rem);
              }
              @media (max-width: 800px) {
                :global(.hero-heading) {
                  --hero-font-size: calc(1.25 * clamp(2.5rem, 8vw, 7rem));
                }
              }
            `}</style>
        </motion.h1>
        {/* Social Icons Row */}
        <div className="flex justify-center items-center gap-4 sm:gap-6 mt-4 mb-2 px-4">
          <a href="https://linkedin.com/in/ryantang" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hover:text-[#e6c47a] transition text-2xl sm:text-3xl">
            <FaLinkedin />
          </a>
          <a href="https://github.com/ryantang" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="hover:text-[#e6c47a] transition text-2xl sm:text-3xl">
            <FaGithub />
          </a>
          <a href="mailto:ryan@example.com" aria-label="Email" className="hover:text-[#e6c47a] transition text-2xl sm:text-3xl">
            <FaEnvelope />
          </a>
          <a href="/RyanTang_Resume.pdf" target="_blank" rel="noopener noreferrer" aria-label="Resume" className="hover:text-[#e6c47a] transition text-2xl sm:text-3xl">
            <FaFileAlt />
          </a>
        </div>
        {/* Project Buttons */}
        <div className="mt-8 flex flex-col md:flex-row gap-3 sm:gap-4 items-center px-4">
          <motion.div
            key="Development"
            custom={0}
            variants={buttonVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            whileTap="tap"
            className="rounded-full px-4 sm:px-7 py-2 sm:py-3 font-bold text-base sm:text-lg tracking-wide border-2 border-[#e6c47a]/70 bg-[#18181b]/70 backdrop-blur-md text-[#f5f5f5] focus:outline-none focus:ring-2 focus:ring-[#e6c47a] focus:ring-offset-2 relative overflow-hidden cursor-pointer"
            style={{
              boxShadow: '0 4px 18px #e6c47a33, 0 1.5px 0 #e6c47a, 0 0 0 2px #00c3ff22, 0 2px 8px #fff2',
              border: '2px solid #e6c47a',
              background: 'linear-gradient(90deg, #232323 60%, #e6c47a22 100%)',
              color: '#f5f5f5',
              transition: 'box-shadow 0.18s, border-color 0.18s, background 0.18s',
              borderRadius: 9999,
              fontSize: 'clamp(0.875rem, 2.5vw, 1.1rem)',
            }}
            onClick={handleDevClick}
          >
            Development
          </motion.div>
          <motion.div
            key="Design"
            custom={1}
            variants={buttonVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            whileTap="tap"
            className="rounded-full px-4 sm:px-7 py-2 sm:py-3 font-bold text-base sm:text-lg tracking-wide border-2 border-[#e6c47a]/70 bg-[#18181b]/70 backdrop-blur-md text-[#f5f5f5] focus:outline-none focus:ring-2 focus:ring-[#e6c47a] focus:ring-offset-2 relative overflow-hidden cursor-pointer"
            style={{
              boxShadow: '0 4px 18px #e6c47a33, 0 1.5px 0 #e6c47a, 0 0 0 2px #00c3ff22, 0 2px 8px #fff2',
              border: '2px solid #e6c47a',
              background: 'linear-gradient(90deg, #232323 60%, #e6c47a22 100%)',
              color: '#f5f5f5',
              transition: 'box-shadow 0.18s, border-color 0.18s, background 0.18s',
              borderRadius: 9999,
              fontSize: 'clamp(0.875rem, 2.5vw, 1.1rem)',
            }}
            onClick={handleDesignClick}
          >
            Design
          </motion.div>
          <motion.div
            key="Retail & Ecommerce"
            custom={2}
            variants={buttonVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            whileTap="tap"
            className="rounded-full px-4 sm:px-7 py-2 sm:py-3 font-bold text-base sm:text-lg tracking-wide border-2 border-[#e6c47a]/70 bg-[#18181b]/70 backdrop-blur-md text-[#f5f5f5] focus:outline-none focus:ring-2 focus:ring-[#e6c47a] focus:ring-offset-2 relative overflow-hidden cursor-pointer"
            style={{
              boxShadow: '0 4px 18px #e6c47a33, 0 1.5px 0 #e6c47a, 0 0 0 2px #00c3ff22, 0 2px 8px #fff2',
              border: '2px solid #e6c47a',
              background: 'linear-gradient(90deg, #232323 60%, #e6c47a22 100%)',
              color: '#f5f5f5',
              transition: 'box-shadow 0.18s, border-color 0.18s, background 0.18s',
              borderRadius: 9999,
              fontSize: 'clamp(0.875rem, 2.5vw, 1.1rem)',
            }}
            onClick={handleRetailClick}
          >
            Retail & Ecommerce
          </motion.div>
        </div>
      </div>
      <BottomMarquee />
      {/* DJ Mixes Button - bottom left */}
      <a
        href="https://soundcloud.com/tangleton"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed left-2 sm:left-6 bottom-16 sm:bottom-20 z-[100] bg-black/80 text-[#e6c47a] px-3 sm:px-5 py-2 rounded-full shadow-lg font-bold text-sm sm:text-lg hover:bg-[#e6c47a] hover:text-black transition border-2 border-[#e6c47a]"
        style={{ letterSpacing: '0.08em' }}
      >
        DJ Mixes
      </a>
      <AnimatePresence>
        {modalType === 'about' && (
          <AboutCard onClose={handleAboutClose} />
        )}
        {modalType === 'design' && (
          <DesignModal onClose={handleDesignClose} />
        )}
      </AnimatePresence>
      {/* Development Modal */}
      {showDevModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4" onClick={handleDevModalClose}>
          <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 max-w-full sm:max-w-md w-full flex flex-col items-center overflow-y-auto" style={{ maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <button onClick={handleDevModalClose} className="absolute top-2 sm:top-4 right-2 sm:right-4 text-xl sm:text-2xl text-gray-400 hover:text-black transition">✕</button>
            <h2 className="text-xl sm:text-2xl font-extrabold mb-2 text-[#18181b] tracking-widest uppercase text-center">Development Projects</h2>
            <div className="w-12 h-1 bg-[#e6c47a] rounded-full mb-6 mx-auto" style={{ minHeight: '4px', height: '4px' }} />
            <div className="text-center italic text-[#e6c47a] mb-4 text-sm sm:text-base" style={{ fontWeight: 500 }}>More info coming soon</div>
            <div className="flex flex-col gap-6 w-full">
              <div className="flex flex-col items-center w-full">
                {/* 16:9 Placeholder for LogoGrab */}
                <div className="w-full aspect-[16/9] bg-gray-200 flex items-center justify-center rounded-lg mb-3 border-2 border-dashed border-gray-400">
                  <span className="text-gray-500 text-lg">Screenshot Placeholder</span>
                </div>
                <a href="https://logograb.com" target="_blank" rel="noopener noreferrer" className="w-full px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-[#18181b] text-[#e6c47a] font-bold text-base sm:text-lg shadow hover:bg-[#e6c47a] hover:text-black border-2 border-[#e6c47a] transition text-center">LogoGrab</a>
                <span className="text-xs sm:text-sm text-gray-700 mt-2 text-center">Quick logo search & downloader for any brand</span>
              </div>
              <div className="flex flex-col items-center w-full">
                {/* 16:9 Placeholder for SEOBot */}
                <div className="w-full aspect-[16/9] bg-gray-200 flex items-center justify-center rounded-lg mb-3 border-2 border-dashed border-gray-400">
                  <span className="text-gray-500 text-lg">Screenshot Placeholder</span>
                </div>
                <a href="https://seobot.us" target="_blank" rel="noopener noreferrer" className="w-full px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-[#18181b] text-[#e6c47a] font-bold text-base sm:text-lg shadow hover:bg-[#e6c47a] hover:text-black border-2 border-[#e6c47a] transition text-center">SEOBot</a>
                <span className="text-xs sm:text-sm text-gray-700 mt-2 text-center">AI-powered Lightweight SEO Assistance Tool</span>
              </div>
              <div className="flex flex-col items-center w-full">
                {/* 16:9 Placeholder for VC13 */}
                <div className="w-full aspect-[16/9] bg-gray-200 flex items-center justify-center rounded-lg mb-3 border-2 border-dashed border-gray-400">
                  <span className="text-gray-500 text-lg">Screenshot Placeholder</span>
                </div>
                <a href="https://vc13.game" target="_blank" rel="noopener noreferrer" className="w-full px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-[#18181b] text-[#e6c47a] font-bold text-base sm:text-lg shadow hover:bg-[#e6c47a] hover:text-black border-2 border-[#e6c47a] transition text-center">VC13</a>
                <span className="text-xs sm:text-sm text-gray-700 mt-2 text-center">AI-powered Vietnamese card game</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Retail & Ecommerce Modal */}
      {showRetailModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4" onClick={handleRetailModalClose}>
          <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 max-w-full sm:max-w-2xl w-full flex flex-col items-center overflow-y-auto" style={{ maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <button onClick={handleRetailModalClose} className="absolute top-2 sm:top-4 right-2 sm:right-4 text-xl sm:text-2xl text-gray-400 hover:text-black transition">✕</button>
            <h2 className="text-xl sm:text-2xl font-extrabold mb-2 text-[#18181b] tracking-widest uppercase text-center">Retail & Ecommerce</h2>
            <div className="w-12 h-1 bg-[#e6c47a] rounded-full mb-6 mx-auto" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 w-full">
              {/* Clients & Professional */}
              <div>
                <h3 className="text-base sm:text-lg font-bold mb-4 text-[#18181b] text-center md:text-left">Clients & Professional</h3>
                <div className="flex flex-col gap-3 sm:gap-4">
                  <a href="https://culturecannabisclub.com" target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-full bg-[#18181b] text-[#e6c47a] font-semibold shadow hover:bg-[#e6c47a] hover:text-black border-2 border-[#e6c47a] transition text-center">
                    <span className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 font-bold text-sm sm:text-lg">🏷️</span>
                    <span className="flex-1 text-left text-sm sm:text-base">Culture Cannabis Club</span>
                  </a>
                  <a href="https://catalyst-cannabis.com" target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-full bg-[#18181b] text-[#e6c47a] font-semibold shadow hover:bg-[#e6c47a] hover:text-black border-2 border-[#e6c47a] transition text-center">
                    <span className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 font-bold text-sm sm:text-lg">🏷️</span>
                    <span className="flex-1 text-left text-sm sm:text-base">Catalyst Cannabis Co</span>
                  </a>
                  <a href="https://traditonal.com" target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-full bg-[#18181b] text-[#e6c47a] font-semibold shadow hover:bg-[#e6c47a] hover:text-black border-2 border-[#e6c47a] transition text-center">
                    <span className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 font-bold text-sm sm:text-lg">🏷️</span>
                    <span className="flex-1 text-left text-sm sm:text-base">Traditional Cannabis Co</span>
                  </a>
                </div>
              </div>
              {/* Personal */}
              <div>
                <h3 className="text-base sm:text-lg font-bold mb-4 text-[#18181b] text-center md:text-left">Personal</h3>
                <div className="flex flex-col gap-3 sm:gap-4">
                  <a href="https://thegoodiesvault.store" target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-full bg-[#18181b] text-[#e6c47a] font-semibold shadow hover:bg-[#e6c47a] hover:text-black border-2 border-[#e6c47a] transition text-center">
                    <span className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 font-bold text-sm sm:text-lg">🏷️</span>
                    <span className="flex-1 text-left text-sm sm:text-base">The Goodies Vault</span>
                  </a>
                  <a href="https://thebusinessvault.store" target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-full bg-[#18181b] text-[#e6c47a] font-semibold shadow hover:bg-[#e6c47a] hover:text-black border-2 border-[#e6c47a] transition text-center">
                    <span className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 font-bold text-sm sm:text-lg">🏷️</span>
                    <span className="flex-1 text-left text-sm sm:text-base">The Business Vault</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// DesignModal component (to be moved to its own file later)
function DesignModal({ onClose }: { onClose: () => void }) {
  const [vantaReady, setVantaReady] = useState(false);
  // Include all assets in public/DesignAssets
  const images = [
    "/DesignAssets/WAVYFMFLYER2.png",
    "/DesignAssets/WAVYFMFLYER001-FINAL.jpeg",
    "/DesignAssets/mindfulthoughts.png",
    "/DesignAssets/ISOULATIONFLYER-FINAL.png",
    "/DesignAssets/ISOULATIONDAYPARTY.png",
    "/DesignAssets/ISOULATION-FRANCHISE-final.png",
    "/DesignAssets/froyonionsoul.png",
    "/DesignAssets/FAMNFRIENDSFLYER.png",
    "/DesignAssets/donttrip1.png",
    "/DesignAssets/4everforward.png",
  ];
  // Track which images failed to load
  const [hidden, setHidden] = useState<Set<number>>(new Set());
  const handleImgError = (idx: number) => {
    setHidden(prev => new Set(prev).add(idx));
  };
  // Enlarged image modal state
  const [enlarged, setEnlarged] = useState<string | null>(null);
  const handleEnlarge = (src: string) => setEnlarged(src);
  const handleCloseEnlarge = () => setEnlarged(null);
  // NOTE: For best performance, consider optimizing/compressing large images in DesignAssets.
  return (
    <>
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.92, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, x: -120 }}
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        onClick={onClose}
        style={{ background: 'rgba(24,24,27,0.60)', backdropFilter: 'blur(6px)' }}
        onAnimationComplete={() => setVantaReady(true)}
      >
        <motion.div
          className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-10 max-w-full sm:max-w-4xl w-full relative flex flex-col items-center"
          onClick={e => e.stopPropagation()}
          initial={{ scale: 0.98 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.98, x: -120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          style={{ zIndex: 2 }}
        >
          <button onClick={onClose} className="absolute top-2 sm:top-4 right-2 sm:right-4 text-xl sm:text-2xl text-gray-400 hover:text-black transition">✕</button>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold mb-2 text-[#18181b] tracking-widest uppercase text-center">Visual Design: Graphics</h2>
          <div className="w-12 h-1 bg-[#e6c47a] rounded-full mb-4 mx-auto" />
          {/* Masonry Grid (CSS Grid) */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 w-full max-h-[60vh] overflow-y-auto overflow-x-hidden"
          >
            {images.map((src, i) => (
              hidden.has(i) ? null : (
                <div key={i} className="rounded-xl overflow-hidden shadow-lg bg-[#f5f5f5] flex flex-col items-center justify-center cursor-pointer" onClick={() => handleEnlarge(src)}>
                  <img
                    src={src}
                    alt="Design graphic"
                    className="w-full h-auto object-cover transition-transform duration-300 hover:scale-105"
                    loading="lazy"
                    onError={() => handleImgError(i)}
                    style={{ display: 'block', width: '100%' }}
                  />
                </div>
              )
            ))}
          </div>
        </motion.div>
      </motion.div>
      {/* Enlarged image modal overlay */}
      {enlarged && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 p-4" onClick={handleCloseEnlarge}>
          <div className="relative max-w-full sm:max-w-3xl w-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <button onClick={handleCloseEnlarge} className="absolute top-2 right-2 text-2xl sm:text-3xl text-white bg-black/60 rounded-full px-2 py-1 hover:bg-black/90 transition z-10">✕</button>
            <img src={enlarged} alt="Enlarged graphic" className="max-h-[80vh] max-w-full rounded-xl shadow-2xl bg-white" style={{ margin: '0 auto', display: 'block' }} />
          </div>
        </div>
      )}
    </>
  );
}
