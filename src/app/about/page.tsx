"use client";
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

function AboutCard({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.32, ease: 'easeInOut' }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-xl w-full relative flex flex-col items-center"
        onClick={e => e.stopPropagation()}
        initial={{ scale: 0.96, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.96, y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 32, opacity: { duration: 0.22 } }}
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

export default function AboutPage() {
  const router = useRouter();
  const [exiting, setExiting] = useState(false);
  const handleClose = () => {
    setExiting(true);
    setTimeout(() => {
      router.replace('/');
    }, 320); // match exit animation duration
  };
  return (
    <AnimatePresence mode="wait">
      {!exiting && <AboutCard key="about-modal" onClose={handleClose} />}
    </AnimatePresence>
  );
} 