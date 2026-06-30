import React, { useState, useEffect } from "react";
import Image from "next/image";

const navLinks = [
  { label: "Email Me", href: "mailto:tangs.email@gmail.com" },
  { label: "Resume", href: "/RyanTangResume2025.png", download: true },
];

export default function Header({ menuHidden = false }: { menuHidden?: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (menuHidden) setOpen(false);
  }, [menuHidden]);

  return (
    <header className="fixed top-0 left-0 w-full z-[300] bg-transparent">
      <nav className="relative z-[2] max-w-6xl mx-auto grid grid-cols-3 items-center px-2 sm:px-4 py-2 sm:py-4">
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
          className={`flex flex-col justify-center items-center w-14 h-14 col-span-1 justify-self-end transition-opacity duration-200${menuHidden ? " invisible pointer-events-none" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          aria-label="Toggle menu"
          aria-hidden={menuHidden}
          tabIndex={menuHidden ? -1 : 0}
          style={{ 
            cursor: 'pointer', 
            background: 'rgba(230, 196, 122, 0.2)',
            border: '2px solid rgba(230, 196, 122, 0.6)',
            borderRadius: '8px',
            position: 'relative',
            pointerEvents: menuHidden ? 'none' : 'auto',
            minWidth: '56px',
            minHeight: '56px'
          }}
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
            margin: 2px 0;
            border-radius: 6px;
            background: #fff;
            box-shadow: 0 1.5px 8px #e6c47a55, 0 0.5px 0 #e6c47a;
            transition: all 0.36s cubic-bezier(.4,0,.2,1);
            position: relative;
            pointer-events: none;
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
          .menu-link {
            color: #fff;
            text-decoration: none;
            font-size: clamp(1.2rem, 4vw, 2rem);
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            transition: all 0.3s cubic-bezier(.4,0,.2,1);
            padding: 8px 16px;
            border-radius: 8px;
          }
          .menu-link:hover {
            color: #e6c47a;
            text-shadow: 0 0 20px #e6c47a;
            transform: translateY(-2px);
          }
        `}</style>
      </nav>
      {/* Overlay Menu */}
      <div
        className={`menu-overlay fixed inset-0 bg-[#18181b] bg-opacity-95 flex flex-col items-center justify-center transition-all duration-500 z-[1] overflow-y-auto${open ? ' open' : ''}`}
        style={{ backdropFilter: 'blur(2px)' }}
        onClick={() => setOpen(false)}
      >
        <ul className={`flex flex-col gap-6 sm:gap-10 items-center transition-transform duration-500 py-8 ${open ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} onClick={(e) => e.stopPropagation()}>
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