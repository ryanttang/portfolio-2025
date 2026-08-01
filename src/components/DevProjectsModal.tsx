"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const MODAL_Z = "z-[10050]";
const modalCloseBtn =
  "absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full text-xl sm:text-2xl text-gray-400 hover:text-black hover:bg-black/5 transition";

const projects = [
  {
    title: "THC Members Only Club",
    href: "https://thcmembersonlyclub.com",
    image: "/thcmembersonlyclub-screen.png",
    alt: "THC Members Only Club Screenshot",
    description: "Cannabis events calendar and community platform",
  },
  {
    title: "Catalyst Social Club",
    href: "https://catalystsocialclub.com",
    image: "/catalystsocialclub-screen.png",
    alt: "Catalyst Social Club Screenshot",
    description: "Cannabis lounge events and event space in Hawthorne, CA",
  },
  {
    title: "fivetwentyfour studios",
    href: "https://fivetwentyfour.studios",
    image: "/524-screen.png",
    alt: "fivetwentyfour studios landing page Screenshot",
    description: "Creative studio showcase and business landing page",
  },
  {
    title: "DJ tangleton EPK",
    href: "https://tangleton.com",
    image: "/tangleton-screen.png",
    alt: "DJ tangleton EPK Screenshot",
    description: "Electronic Press Kit and music showcase",
  },
  {
    title: "Cannagrab.App",
    href: "https://cannagrab.app",
    image: "/cannagrab-screen.png",
    alt: "Cannagrab.App Screenshot",
    description: "Cannabis Brands Logo Search & Bulk Downloader",
  },
] as const;

export default function DevProjectsModal({ onClose }: { onClose: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 ${MODAL_Z} flex items-center justify-center bg-black/70 p-4`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dev-projects-title"
    >
      <div
        className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 max-w-full sm:max-w-md w-full flex flex-col items-center overflow-y-auto"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} className={modalCloseBtn} aria-label="Close">
          ✕
        </button>
        <h2
          id="dev-projects-title"
          className="text-xl sm:text-2xl font-extrabold mb-2 text-[#18181b] tracking-widest uppercase text-center"
        >
          Development Projects
        </h2>
        <div
          className="w-12 h-1 bg-[#fdf0d5] rounded-full mb-6 mx-auto"
          style={{ minHeight: "4px", height: "4px" }}
        />
        <div className="flex flex-col gap-6 w-full">
          {projects.map((project) => (
            <div key={project.title} className="flex flex-col items-center w-full">
              <a
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-[#18181b] text-[#fdf0d5] font-bold text-base sm:text-lg shadow hover:bg-[#fdf0d5] hover:text-black border-2 border-[#fdf0d5] transition text-center"
              >
                {project.title}
              </a>
              <span className="text-xs sm:text-sm text-gray-700 mt-2 mb-3 text-center">
                {project.description}
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={project.image}
                alt={project.alt}
                className="w-full aspect-[16/9] rounded-lg object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
