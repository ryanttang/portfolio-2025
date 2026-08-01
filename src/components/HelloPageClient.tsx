"use client";

import { useState } from "react";
import Header from "@/components/Header";
import DevProjectsModal from "@/components/DevProjectsModal";
import type { HelloContent } from "@/lib/content/schemas";
import {
  FaEnvelope,
  FaFileAlt,
  FaGithub,
  FaLinkedin,
} from "react-icons/fa";

const cardClass =
  "rounded-xl border border-[#fdf0d5]/25 bg-[#232323]/55 p-4 sm:p-5 transition";

function mailtoHref(email: string) {
  const address = email.replace(/^mailto:/i, "").trim();
  return `mailto:${address}?subject=${encodeURIComponent("Hello from your card")}`;
}

export default function HelloPageClient({ content }: { content: HelloContent }) {
  const [showPortfolio, setShowPortfolio] = useState(false);

  const { greeting, links, whoICanHelp, consulting, cta } = content;
  const emailHref = mailtoHref(links.email);

  return (
    <div
      className="min-h-screen bg-[#18181b] text-[#f5f5f5] relative overflow-x-hidden text-[17px] sm:text-lg"
      style={{ fontFamily: "var(--font-saira), Saira, sans-serif" }}
    >
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(230,196,122,0.12), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 50%, rgba(0,195,255,0.05), transparent 50%), #18181b",
        }}
      />

      <Header />

      <main className="relative z-10 pt-24 sm:pt-28 pb-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-8 sm:space-y-10">
          <header className="flex flex-col gap-6">
            <div className="max-w-3xl">
              <p className="text-[#fdf0d5] text-sm font-semibold mb-3 tracking-wide">
                {greeting.eyebrow}
              </p>
              <h1
                className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-[1.15] mb-4 tracking-tight"
                style={{ textShadow: "0 4px 32px #232323cc" }}
              >
                {greeting.headline}
              </h1>
              <p className="text-[#fdf0d5] text-[11px] sm:text-sm font-semibold tracking-wide mb-3 whitespace-nowrap overflow-x-auto scrollbar-none" style={{ scrollbarWidth: "none" }}>
                {greeting.pillars}
              </p>
              <div className="flex items-center gap-4 sm:gap-5 mb-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/headshot.jpeg"
                  alt="Ryan Tang"
                  className="w-36 h-36 sm:w-44 sm:h-44 rounded-full object-cover shrink-0 border-2 border-[#fdf0d5]/40"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[#c4c4c8] text-sm sm:text-base font-bold leading-snug">
                    {greeting.tagline}
                  </p>
                  {greeting.supporting ? (
                    <p className="text-[#c4c4c8] text-sm sm:text-base font-bold leading-snug mt-0.5">
                      {greeting.supporting}
                    </p>
                  ) : null}
                  {greeting.availability ? (
                    <p className="text-[#fdf0d5]/80 text-xs sm:text-sm font-light italic tracking-wide mt-3 sm:mt-4">
                      {greeting.availability}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-nowrap items-center justify-between gap-3 sm:gap-4 text-white">
              <div className="flex flex-nowrap items-center gap-3 sm:gap-5">
                {links.linkedin ? (
                  <a
                    href={links.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="inline-flex items-center justify-center size-10 sm:size-11 shrink-0 text-2xl sm:text-3xl transition hover:text-[#fdf0d5]"
                  >
                    <FaLinkedin />
                  </a>
                ) : null}
                {links.github ? (
                  <a
                    href={links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub"
                    className="inline-flex items-center justify-center size-10 sm:size-11 shrink-0 text-2xl sm:text-3xl transition hover:text-[#fdf0d5]"
                  >
                    <FaGithub />
                  </a>
                ) : null}
                {links.resumeUrl ? (
                  <a
                    href={links.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Resume"
                    className="inline-flex items-center justify-center size-10 sm:size-11 shrink-0 text-2xl sm:text-3xl transition hover:text-[#fdf0d5]"
                  >
                    <FaFileAlt />
                  </a>
                ) : null}
              </div>
              <div className="flex flex-nowrap items-center justify-end gap-2 sm:gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPortfolio(true)}
                  className="inline-flex items-center justify-center h-10 sm:h-11 rounded-full px-3 sm:px-5 text-xs sm:text-sm font-semibold border-2 border-[#fdf0d5]/50 bg-transparent text-[#fdf0d5] transition hover:border-[#fdf0d5] hover:bg-[#fdf0d5]/10 whitespace-nowrap"
                >
                  View Portfolio
                </button>
                {links.email ? (
                  <a
                    href={emailHref}
                    className="inline-flex items-center justify-center h-10 sm:h-11 rounded-full px-3 sm:px-5 text-xs sm:text-sm font-semibold border-2 border-[#fdf0d5] bg-[#232323] text-[#f5f5f5] shadow-[0_4px_18px_#fdf0d533] transition hover:bg-[#fdf0d5] hover:text-[#18181b] whitespace-nowrap"
                  >
                    Connect With Me
                  </a>
                ) : null}
              </div>
            </div>
          </header>

          {showPortfolio ? (
            <DevProjectsModal onClose={() => setShowPortfolio(false)} />
          ) : null}

          <section aria-labelledby="who-help-heading">
            <h2
              id="who-help-heading"
              className="text-[#fdf0d5] text-xs sm:text-sm tracking-wide mb-4 font-semibold"
            >
              {whoICanHelp.title}
            </h2>
            <div className={cardClass}>
              <ul className="space-y-3">
                {whoICanHelp.items.map((item) => (
                  <li
                    key={item}
                    className="text-[#c4c4c8] text-sm sm:text-base leading-snug border-b border-[#fdf0d5]/15 pb-3 last:border-0 last:pb-0"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section aria-labelledby="services-heading">
            <h2
              id="services-heading"
              className="text-[#fdf0d5] text-xs sm:text-sm tracking-wide mb-4 font-semibold"
            >
              What I Can Help With
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {content.serviceSections.map((section, i) => {
                const headerTone =
                  [
                    "border-[#fdf0d5]/50 bg-[#fdf0d5]/15 text-[#fdf0d5]",
                    "border-[#7dd3fc]/50 bg-[#7dd3fc]/15 text-[#7dd3fc]",
                    "border-[#c4b5fd]/50 bg-[#c4b5fd]/15 text-[#c4b5fd]",
                    "border-[#86efac]/50 bg-[#86efac]/15 text-[#86efac]",
                  ][i % 4] ?? "border-[#fdf0d5]/50 bg-[#fdf0d5]/15 text-[#fdf0d5]";

                return (
                  <div key={section.id} className={cardClass}>
                    <h3
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] sm:text-sm font-semibold tracking-wide mb-3 ${headerTone}`}
                    >
                      {section.label}
                    </h3>
                    <ul className="space-y-2 sm:space-y-3">
                      {section.items.map((item) => (
                        <li
                          key={item}
                          className="text-[#c4c4c8] text-xs sm:text-base leading-snug border-b border-[#fdf0d5]/15 pb-2 sm:pb-3 last:border-0 last:pb-0"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3 items-stretch">
            <section
              aria-labelledby="lifecycle-heading"
              className="flex flex-col min-h-0"
            >
              <h2
                id="lifecycle-heading"
                className="text-[#fdf0d5] text-xs sm:text-sm tracking-wide mb-4 font-semibold"
              >
                How I Work
              </h2>
              <div className={`${cardClass} overflow-hidden flex-1 flex flex-col`}>
                <ol className="relative pl-2 list-none flex-1 flex flex-col justify-between">
                  <div
                    aria-hidden
                    className="absolute left-[23px] top-4 bottom-4 w-px"
                    style={{
                      background:
                        "linear-gradient(180deg, #fdf0d522, #fdf0d5, #fdf0d5, #fdf0d522)",
                    }}
                  />
                  {content.lifecycle.map((step, i) => (
                    <li
                      key={step}
                      className="relative flex items-start gap-3 sm:gap-4 py-1 first:pt-0 last:pb-0"
                    >
                      <span
                        className="relative z-10 flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#fdf0d5] bg-[#18181b] text-[#fdf0d5] text-[10px] sm:text-xs font-bold"
                        style={{ boxShadow: "0 0 14px #fdf0d555" }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="pt-1 text-[#c4c4c8] text-xs sm:text-base leading-snug">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            <section
              aria-labelledby="skills-heading"
              className="flex flex-col min-h-0"
            >
              <h2
                id="skills-heading"
                className="text-[#fdf0d5] text-xs sm:text-sm tracking-wide mb-4 font-semibold"
              >
                Skills
              </h2>
              <div className={`${cardClass} flex-1`}>
                <div className="space-y-4">
                  {content.skillGroups.map((group) => (
                    <div key={group.skill}>
                      <h3 className="text-white text-sm sm:text-base font-semibold mb-2 leading-snug">
                        {group.skill}
                      </h3>
                      {group.disciplines.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {group.disciplines.map((item) => (
                            <span
                              key={item}
                              className="text-xs sm:text-sm text-[#c4c4c8] border border-[#fdf0d5]/20 rounded-lg px-2 py-0.5"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <h2
                id="retainers-heading"
                className="text-[#fdf0d5] text-xs sm:text-sm tracking-wide mb-4 font-semibold"
              >
                Retainers Services
              </h2>
            </div>
            <div>
              <h2
                id="consulting-heading"
                className="text-[#fdf0d5] text-xs sm:text-sm tracking-wide mb-4 font-semibold"
              >
                Consulting Services
              </h2>
            </div>

            {content.retainers.map((tier) => (
              <div key={tier.name} className={cardClass}>
                <h3 className="text-base sm:text-xl font-bold text-white mb-2 sm:mb-3">
                  {tier.name}
                </h3>
                <p className="text-[#c4c4c8] text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                  {tier.summary.includes("\n")
                    ? tier.summary.replace(/\n+/g, "\n\n")
                    : tier.summary.replace(/\.\s+/, ".\n\n")}
                </p>
              </div>
            ))}

            <div className={`${cardClass} border-[#fdf0d5]/45`}>
              <h3 className="text-base sm:text-xl font-bold text-white mb-2 sm:mb-3">
                {consulting.title}
              </h3>
              <p className="text-[#c4c4c8] text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                {consulting.summary.includes("\n")
                  ? consulting.summary.replace(/\n+/g, "\n\n")
                  : consulting.summary.replace(/\.\s+/, ".\n\n")}
              </p>
            </div>
          </div>

          <section className={`${cardClass} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`}>
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Ready to talk?</h2>
              <p className="text-[#a1a1aa] text-base">
                Feel free to reach out to discuss any project ideas
              </p>
            </div>
            <a
              href={emailHref}
              className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold border-2 border-[#fdf0d5] bg-[#232323] text-[#f5f5f5] text-base shadow-[0_4px_18px_#fdf0d533] transition hover:bg-[#fdf0d5] hover:text-[#18181b] shrink-0"
            >
              <FaEnvelope className="text-xs" />
              {cta.emailLabel}
            </a>
          </section>
        </div>
      </main>
    </div>
  );
}
