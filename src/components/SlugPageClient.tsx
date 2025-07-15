"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

interface VantaConfig {
  el: HTMLElement;
  mouseControls: boolean;
  touchControls: boolean;
  gyroControls: boolean;
  minHeight: number;
  minWidth: number;
  scale: number;
  scaleMobile: number;
  color: number;
  color2: number;
  backgroundColor: number;
  size: number;
  spacing: number;
  showLines: boolean;
}

interface VantaInstance {
  destroy: () => void;
}

declare global {
  interface Window {
    VANTA: {
      CLOUDS: (config: VantaConfig) => VantaInstance;
      NET: (config: VantaConfig) => VantaInstance;
      RINGS: (config: VantaConfig) => VantaInstance;
    };
  }
}

export default function SlugPageClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [vantaInstance, setVantaInstance] = useState<VantaInstance | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const loadVanta = async () => {
      if (typeof window !== "undefined" && window.VANTA && containerRef.current) {
        const vanta = window.VANTA.CLOUDS({
          el: containerRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          scaleMobile: 1.0,
          color: 0x3b82f6,
          color2: 0x1e40af,
          backgroundColor: 0x0a0a0a,
          size: 1.0,
          spacing: 1.0,
          showLines: false,
        });
        setVantaInstance(vanta);
      }
    };

    loadVanta();

    return () => {
      if (vantaInstance) {
        vantaInstance.destroy();
      }
    };
  }, [vantaInstance]);

  const sections = [
    {
      title: "Welcome to My Portfolio",
      content: "Explore my work and experience in software development.",
      image: "/headshot.png",
    },
    {
      title: "About Me",
      content: "I'm a passionate developer focused on creating innovative solutions.",
      image: "/headshot.png",
    },
    {
      title: "Projects",
      content: "Check out some of my recent projects and contributions.",
      image: "/headshot.png",
    },
  ];

  const nextSection = () => {
    setCurrentSection((prev) => (prev + 1) % sections.length);
  };

  const prevSection = () => {
    setCurrentSection((prev) => (prev - 1 + sections.length) % sections.length);
  };

  return (
    <div ref={containerRef} className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        <motion.div
          key={currentSection}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl font-bold text-white mb-8"
          >
            {sections[currentSection].title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto"
          >
            {sections[currentSection].content}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="relative w-64 h-64 mx-auto mb-8"
          >
            <Image
              src={sections[currentSection].image}
              alt="Profile"
              fill
              className="rounded-full object-cover shadow-2xl"
              priority
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex justify-center space-x-4"
          >
            <button
              onClick={prevSection}
              className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all duration-300 border border-white/20"
            >
              Previous
            </button>
            <button
              onClick={nextSection}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300"
            >
              Next
            </button>
          </motion.div>
        </motion.div>

        {/* Navigation Dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex space-x-2 mt-8"
        >
          {sections.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSection(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSection
                  ? "bg-white scale-125"
                  : "bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </motion.div>
      </div>

      {/* Floating Elements */}
      <motion.div
        animate={{
          y: [0, -20, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-20 left-20 w-16 h-16 bg-blue-500/20 rounded-full blur-xl"
      />
      <motion.div
        animate={{
          y: [0, 20, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-20 right-20 w-24 h-24 bg-purple-500/20 rounded-full blur-xl"
      />
    </div>
  );
}
