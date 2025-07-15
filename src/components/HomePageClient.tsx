"use client";
import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TetrisGame from "@/components/TetrisGame";
import Header from "@/components/Header";
import * as THREE from "three";
import { BottomMarquee } from "@/components/GreetingMarquee";
import { Canvas } from "@react-three/fiber";
import React from "react";
import { useRouter, useParams } from 'next/navigation';
import VantaRingsBackground from "@/components/VantaRingsBackground";
import { useSpring, a } from '@react-spring/three';
import { FaLinkedin, FaGithub, FaEnvelope, FaFileAlt } from "react-icons/fa";

function FloatingSphere({ onClick }: { onClick?: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = React.useState(false);
  const [shape, setShape] = React.useState<'sphere'|'box'|'torus'|'cone'|'octahedron'>('sphere');
  const [mouse, setMouse] = React.useState<{x: number, y: number} | null>(null);
  const [gradient] = useState([
    '#e6c47a', '#00c3ff', '#f5f5f5', '#232323', '#ff6f61', '#6a82fb', '#fc5c7d', '#43cea2', '#185a9d', '#f7971e'
  ]);
  const [, setGradientIdx] = useState(0);
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

function AboutCard({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[30000] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-black transition">✕</button>
        <h2 className="text-2xl sm:text-3xl font-extrabold mb-6 text-[#18181b] tracking-widest uppercase">About Me</h2>
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-700 mb-4">
            I&apos;m a passionate developer and designer focused on creating innovative digital experiences. 
            With expertise in modern web technologies and user-centered design, I build solutions that 
            are both beautiful and functional.
          </p>
          <p className="text-gray-700 mb-4">
            My work spans across frontend development, UI/UX design, and creative direction. 
            I believe in the power of thoughtful design to create meaningful connections between 
            users and technology.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div>
              <h3 className="text-xl font-bold text-[#18181b] mb-3">Skills</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• React & Next.js Development</li>
                <li>• TypeScript & JavaScript</li>
                <li>• UI/UX Design</li>
                <li>• Creative Direction</li>
                <li>• Three.js & WebGL</li>
                <li>• Motion Design</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#18181b] mb-3">Experience</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Frontend Development</li>
                <li>• Interactive Web Experiences</li>
                <li>• Design Systems</li>
                <li>• Performance Optimization</li>
                <li>• Cross-platform Development</li>
                <li>• Creative Technology</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



export default function HomePageClient() {
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<unknown>(null);
  const router = useRouter();
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
      (vantaEffect.current as { destroy: () => void }).destroy();
      vantaEffect.current = null;
    }
    // Only initialize if modal is NOT open
    if ((!modalType || modalType === '') && vantaRef.current) {
      // Use global VANTA object
      if (typeof window !== 'undefined' && window.VANTA && window.VANTA.RINGS) {
        vantaEffect.current = window.VANTA.RINGS({
          el: vantaRef.current,
          backgroundColor: 0x18181b,
          color: 0xe6c47a,
          ringColor: 0xf5f5f5,
          shadowColor: 0x232323,
          speed: 0.8,
          spacing: 18.0,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
        // Assign THREE to window for Vanta
        if (typeof window !== 'undefined') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).THREE = THREE;
        }
      } else {
        console.error('VANTA.RINGS not available');
      }
    }
    // Always clean up on unmount
    return () => {
      if (vantaEffect.current) {
        (vantaEffect.current as { destroy: () => void }).destroy();
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

      {/* Modals */}
      <AnimatePresence>
        {showDevModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AboutCard onClose={handleDevModalClose} />
          </motion.div>
        )}
        {showRetailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AboutCard onClose={handleRetailModalClose} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Marquee */}
      <BottomMarquee />
    </div>
  );
} 