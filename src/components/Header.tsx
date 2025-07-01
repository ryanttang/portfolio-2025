import React, { useState } from "react";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Projects", href: "#projects" },
  { label: "Skills", href: "#skills" },
  { label: "Resume", href: "/RyanTang_Resume.pdf", download: true },
  { label: "Contact", href: "#contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-transparent">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 py-4">
        {/* Logo/Brand */}
        <a href="#home" className="text-2xl font-extrabold tracking-widest text-white hover:text-[#e6c47a] transition whitespace-nowrap" style={{ letterSpacing: "0.18em" }}>RYANTANG</a>
        {/* Hamburger Menu */}
        <button
          className="hamburger flex flex-col justify-center items-center w-10 h-10 group z-[100]"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span className={`block h-0.5 w-7 my-0.5 rounded-full bg-white transition-all duration-300 ${open ? 'rotate-45 translate-y-2 bg-[#e6c47a]' : ''}`}></span>
          <span className={`block h-0.5 w-7 my-0.5 rounded-full bg-white transition-all duration-300 ${open ? 'opacity-0' : ''}`}></span>
          <span className={`block h-0.5 w-7 my-0.5 rounded-full bg-white transition-all duration-300 ${open ? '-rotate-45 -translate-y-2 bg-[#e6c47a]' : ''}`}></span>
        </button>
      </nav>
      {/* Overlay Menu */}
      <div
        className={`menu-overlay fixed inset-0 bg-[#18181b] bg-opacity-95 flex flex-col items-center justify-center transition-all duration-500 z-40${open ? ' open' : ''}`}
        style={{ backdropFilter: 'blur(2px)' }}
      >
        <ul className={`flex flex-col gap-10 items-center transition-transform duration-500 ${open ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
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