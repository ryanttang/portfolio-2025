import React, { useState } from "react";
import GreetingTypewriter from "@/components/GreetingMarquee";
import Image from "next/image";

const navLinks = [
  { label: "Email Me", href: "mailto:tangs.email@gmail.com" },
  { label: "Resume", href: "/RyanTang_Resume.pdf", download: true },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-transparent">
      <nav className="max-w-6xl mx-auto grid grid-cols-3 items-center px-2 sm:px-4 py-2 sm:py-4">
        {/* Logo/Brand */}
        <a href="#home" className="col-span-1 justify-self-start flex items-center logo-animate" style={{ minWidth: 'clamp(60px, 15vw, 108px)', minHeight: 'clamp(60px, 15vw, 108px)' }}>
          <Image
            src="/cloudlogo.png"
            alt="Logo"
            width={108}
            height={108}
            style={{ filter: 'invert(1) brightness(2) drop-shadow(0 0 16px #e6c47a)', objectFit: 'contain' }}
            priority
            className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28"
          />
        </a>
        <style jsx>{`
          .logo-animate {
            animation: cloudRock 9s cubic-bezier(.4,0,.2,1) infinite;
            transition: transform 0.18s cubic-bezier(.4,0,.2,1);
          }
          .logo-animate:hover {
            transform: scale(1.08) rotate(-4deg);
            filter: drop-shadow(0 0 32px #e6c47a88) brightness(2);
          }
          @keyframes cloudRock {
            0% { transform: rotate(-10deg); }
            15% { transform: rotate(-7deg); }
            30% { transform: rotate(-3deg); }
            50% { transform: rotate(10deg); }
            70% { transform: rotate(-3deg); }
            85% { transform: rotate(-7deg); }
            100% { transform: rotate(-10deg); }
          }
        `}</style>
        {/* Greeting Typewriter Animation */}
        <div className="col-span-1" />
        {/* Hamburger Menu */}
        <button
          className={`hamburger flex flex-col justify-center items-center w-8 h-8 sm:w-10 sm:h-10 group z-[100] col-span-1 justify-self-end hamburger-animate${open ? ' open' : ''}`}
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span className={`hamburger-bar ${open ? 'open-top' : ''}`}></span>
          <span className={`hamburger-bar ${open ? 'open-middle' : ''}`}></span>
          <span className={`hamburger-bar ${open ? 'open-bottom' : ''}`}></span>
        </button>
        <style jsx>{`
          .hamburger-animate {
            transition: filter 0.22s cubic-bezier(.4,0,.2,1);
          }
          .hamburger-animate:hover,
          .hamburger-animate.open {
            filter: drop-shadow(0 0 12px #e6c47a88) brightness(1.2);
            animation: hamburgerPulse 0.7s cubic-bezier(.4,0,.2,1);
          }
          @keyframes hamburgerPulse {
            0% { transform: scale(1); }
            30% { transform: scale(1.08) rotate(-2deg); }
            60% { transform: scale(0.98) rotate(2deg); }
            100% { transform: scale(1); }
          }
          .hamburger-bar {
            display: block;
            height: 4px;
            width: 24px;
            margin: 3px 0;
            border-radius: 6px;
            background: #fff;
            box-shadow: 0 1.5px 8px #e6c47a55, 0 0.5px 0 #e6c47a;
            transition: all 0.36s cubic-bezier(.4,0,.2,1);
          }
          @media (min-width: 640px) {
            .hamburger-bar {
              height: 5px;
              width: 32px;
              margin: 4px 0;
              border-radius: 8px;
            }
          }
          .hamburger-bar.open-top {
            background: #e6c47a;
            transform: rotate(45deg) translateY(10px);
            box-shadow: 0 2px 16px #e6c47a99;
          }
          .hamburger-bar.open-middle {
            opacity: 0;
            transform: scaleX(0.6);
          }
          .hamburger-bar.open-bottom {
            background: #e6c47a;
            transform: rotate(-45deg) translateY(-10px);
            box-shadow: 0 2px 16px #e6c47a99;
          }
        `}</style>
      </nav>
      {/* Overlay Menu */}
      <div
        className={`menu-overlay fixed inset-0 bg-[#18181b] bg-opacity-95 flex flex-col items-center justify-center transition-all duration-500 z-40 overflow-y-auto${open ? ' open' : ''}`}
        style={{ backdropFilter: 'blur(2px)' }}
      >
        <ul className={`flex flex-col gap-6 sm:gap-10 items-center transition-transform duration-500 py-8 ${open ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          {navLinks.map((link, idx) => (
            <li key={link.label} style={{ transitionDelay: open ? `${idx * 60 + 200}ms` : '0ms' }} className="transition-all duration-500">
              {link.download ? (
                <a
                  href={link.href}
                  download
                  className="menu-link"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              ) : (
                <a
                  href={link.href}
                  className="menu-link"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
} 