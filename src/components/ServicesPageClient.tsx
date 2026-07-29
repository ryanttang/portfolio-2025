"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { FaEnvelope } from "react-icons/fa";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "projects", label: "Services" },
  { id: "retainers", label: "Retainers" },
  { id: "intensives", label: "Consulting" },
  { id: "terms", label: "Terms" },
] as const;

type TabId = (typeof tabs)[number]["id"];

const lifecycleSteps = [
  "Identify opportunities",
  "Develop the strategy",
  "Design the solution",
  "Build the technology",
  "Launch the marketing",
  "Measure performance",
  "Optimize continuously",
];

const overviewGroups = [
  {
    title: "Services",
    items: [
      { label: "Web & Marketing Strategy", price: "$1,250" },
      { label: "Web & Marketing Projects", price: "$2,500" },
      { label: "Website Design & Development", price: "$5,000" },
    ],
  },
  {
    title: "Retainers",
    items: [
      { label: "Consulting", price: "$500" },
      { label: "Monthly Support", price: "$5,000/mo" },
    ],
  },
];

const dayRateExamples = [
  "Marketing Strategy Workshops",
  "Website Planning & Architecture",
  "Brand and Digital Audits",
  "Campaign Planning",
  "Analytics & Conversion Reviews",
  "On-Site Consulting",
  "Marketing-Team Training",
  "Executive Strategy Sessions",
];

const intensiveStrategy = [
  "Up to six hours of consulting",
  "Marketing and digital ecosystem review",
  "Prioritized recommendations",
];

const intensiveDeliverables = [
  "Pre-session questionnaire",
  "30-day action roadmap",
  "One follow-up call",
];

const retainers = [
  {
    name: "Digital Advisor",
    price: "$2,500",
    positioning: "Strategy, consulting, analytics, and optimization",
    bestFor: "Teams with internal staff who need senior guidance",
    capacity: "~16 hours of access",
    strategy: [
      "Monthly marketing strategy",
      "Analytics and KPI review",
      "Campaign review",
      "Two strategy meetings",
    ],
    deliverables: [
      "Website and conversion recommendations",
      "SEO guidance",
    ],
  },
  {
    name: "Monthly Support",
    price: "$5,000",
    positioning: "Strategy plus ongoing marketing execution",
    bestFor: "Businesses ready for consistent campaign and channel support",
    capacity: "~20–25 hours allocated",
    strategy: [
      "Digital strategy",
      "Campaign planning",
    ],
    deliverables: [
      "Website optimization",
      "SEO improvements",
      "Email marketing support",
      "Creative and design support",
      "Monthly reporting",
    ],
  },
];

const projectSections = [
  {
    id: "strategy",
    label: "Strategy & Brand",
    items: [
      { project: "Digital Marketing Audit", range: "$1,500" },
      { project: "Full Marketing Strategy", range: "$3,500" },
      { project: "Brand Identity Package", range: "$3,500" },
    ],
  },
  {
    id: "websites",
    label: "Websites",
    items: [
      { project: "Landing Page", range: "$2,000" },
      { project: "Small Business Website", range: "$5,000" },
      { project: "Custom Marketing Website", range: "$8,000" },
      { project: "E-Commerce Website", range: "$10,000" },
      { project: "Website Redesign", range: "$7,500" },
      { project: "SEO Optimization", range: "$1,500" },
    ],
  },
  {
    id: "systems",
    label: "Systems & Growth",
    items: [
      { project: "SEO Foundation Project", range: "$2,500" },
      { project: "Email/SMS Automation Setup", range: "$2,500" },
      { project: "Marketing Dashboard", range: "$2,500" },
    ],
  },
  {
    id: "custom",
    label: "Custom Build",
    items: [
      { project: "Custom Web Application", range: "$20,000" },
    ],
  },
] as const;

type ProjectSectionId = (typeof projectSections)[number]["id"];

const complexityFactors = [
  "Strategy & Discovery",
  "Custom vs. Template",
  "Copywriting",
  "SEO",
  "Integrations",
  "E-Commerce",
  "Custom Functionality",
  "Analytics",
  "CRM",
  "Automation",
  "Testing",
  "Training",
  "Post-Launch Support",
  "Build Time",
  "Maintenance",
];

const systemsComplexityFactors = [
  "SEO Audit Depth",
  "Keyword & Content Scope",
  "Technical Fixes",
  "Email/SMS Channels",
  "Automation Flows",
  "Audience Segmentation",
  "Platform Integrations",
  "CRM Sync",
  "Data Sources",
  "KPI Selection",
  "Custom Reporting",
  "Dashboard Complexity",
  "Testing & QA",
  "Training & Handoff",
  "Maintenance",
];

const combinedServices = [
  "Brand Positioning",
  "UX Strategy",
  "Web Design",
  "Development",
  "SEO",
  "Analytics",
  "Conversion Optimization",
  "Email Capture",
  "Email/SMS Marketing",
  "Campaigns",
  "Retention",
  "Marketing Automation",
  "Launch Strategy",
];

const skills = [
  "Full Stack Development",
  "Campaigns & Automations",
  "Data & Analytics",
  "Graphic Design",
  "Copywriting",
];

const projectTerms = [
  "Two revision rounds included; additional revisions billed separately",
  "Client delays may shift the delivery timeline",
  "Out-of-scope requests require a change order",
  "Rush projects carry a 25–50% premium",
];

const retainerTerms = [
  "Paid at the beginning of each month",
  "Three-month initial commitment",
  "Defined monthly capacity",
  "Unused capacity expires",
  "Additional work billed at $150/hour or quoted separately",
  "30-day cancellation notice after the initial term",
];

const cardClass =
  "rounded-xl border border-[#e6c47a]/25 bg-[#232323]/55 p-4 sm:p-5 transition";
const cardActiveClass =
  "rounded-xl border border-[#e6c47a] bg-[#e6c47a]/10 p-4 sm:p-5 transition shadow-[0_0_0_1px_#e6c47a44]";

export default function ServicesPageClient() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [activeRetainer, setActiveRetainer] = useState(0);
  const [activeProjectSection, setActiveProjectSection] = useState<ProjectSectionId>("websites");

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

      <main className="relative z-10 pt-24 sm:pt-28 pb-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Compact hero */}
          <header className="mb-8 sm:mb-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-3xl">
              <p className="text-[#e6c47a] text-sm font-semibold mb-3 tracking-wide">
                Ryan Tang · Services
              </p>
              <h1
                className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-[1.15] mb-4 tracking-tight"
                style={{ textShadow: "0 4px 32px #232323cc" }}
              >
                Digital &amp; Marketing Strategist
              </h1>
              <p className="text-[#e6c47a] text-sm sm:text-base font-semibold tracking-wide mb-3">
                Strategy • Branding • Websites • Marketing • Automation • AI • Analytics
              </p>
              <p className="text-[#c4c4c8] text-base sm:text-lg font-bold leading-relaxed max-w-xl">
                I design and build digital systems that help businesses grow.
              </p>
            </div>
            <a
              href="mailto:tangs.email@gmail.com?subject=Services%20Inquiry"
              className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold border-2 border-[#e6c47a] text-[#f5f5f5] text-base transition hover:bg-[#e6c47a] hover:text-[#18181b] shrink-0 self-start lg:self-auto"
              style={{
                background: "linear-gradient(90deg, #232323 60%, #e6c47a22 100%)",
                boxShadow: "0 4px 18px #e6c47a33",
              }}
            >
              <FaEnvelope className="text-xs" />
              Start a Conversation
            </a>
          </header>

          {/* Tabs */}
          <div
            role="tablist"
            aria-label="Service categories"
            className="flex gap-1 sm:gap-2 overflow-x-auto pb-1 mb-6 border-b border-[#e6c47a]/20 scrollbar-none"
            style={{ scrollbarWidth: "none" }}
          >
            {tabs.map((tab) => {
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  id={`tab-${tab.id}`}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 px-3 sm:px-4 py-2.5 text-base font-semibold border-b-2 transition ${
                    selected
                      ? "border-[#e6c47a] text-[#e6c47a]"
                      : "border-transparent text-[#a1a1aa] hover:text-white"
                  }`}
                  style={{ minWidth: "auto", minHeight: "auto" }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Panels — all kept in DOM for crawlability; inactive use hidden */}
          <div className="min-h-[420px]">
            <div
              role="tabpanel"
              id="panel-overview"
              aria-labelledby="tab-overview"
              hidden={activeTab !== "overview"}
            >
                <div className="grid sm:grid-cols-2 gap-3 mb-6">
                  {overviewGroups.map((group) => (
                    <div key={group.title} className={cardClass}>
                      <h2 className="text-[#e6c47a] text-sm tracking-wide mb-4 font-semibold">
                        {group.title}
                      </h2>
                      <ul className="space-y-3">
                        {group.items.map((item) => (
                          <li
                            key={item.label}
                            className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 border-b border-[#e6c47a]/15 pb-3 last:border-0 last:pb-0"
                          >
                            <span className="text-[#c4c4c8] text-base leading-snug">{item.label}</span>
                            <span className="text-[#e6c47a] text-xl font-extrabold whitespace-nowrap">
                              From {item.price}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className={`${cardClass} overflow-hidden`}>
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-8">
                    <div>
                      <h2 className="text-[#e6c47a] text-sm tracking-wide mb-1 font-semibold">
                        Full Lifecycle
                      </h2>
                      <p className="text-[#a1a1aa] text-sm sm:text-base leading-relaxed">
                        What I Provide
                      </p>
                    </div>
                    <p className="text-[#e6c47a]/70 text-xs font-semibold tracking-wide hidden sm:block">
                      Strategy → Implementation → Growth
                    </p>
                  </div>

                  {/* Mobile: vertical spine */}
                  <ol className="relative sm:hidden pl-2 list-none">
                    <div
                      aria-hidden
                      className="absolute left-[23px] top-4 bottom-4 w-px"
                      style={{
                        background:
                          "linear-gradient(180deg, #e6c47a22, #e6c47a, #e6c47a, #e6c47a22)",
                      }}
                    />
                    {lifecycleSteps.map((step, i) => (
                      <li key={step} className="relative flex items-start gap-4 pb-6 last:pb-0">
                        <span
                          className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#e6c47a] bg-[#18181b] text-[#e6c47a] text-xs font-bold"
                          style={{ boxShadow: "0 0 14px #e6c47a55" }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="pt-1 text-[#c4c4c8] text-base leading-snug">{step}</span>
                      </li>
                    ))}
                  </ol>

                  {/* Desktop: horizontal process rail */}
                  <ol className="relative hidden sm:block list-none">
                    <div
                      aria-hidden
                      className="absolute left-[4%] right-[4%] top-[15px] h-[2px] rounded-full"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent, #e6c47a66 5%, #e6c47a 25%, #e6c47a 75%, #e6c47a66 95%, transparent)",
                      }}
                    />
                    <div className="relative flex justify-between">
                      {lifecycleSteps.map((step, i) => (
                        <li
                          key={step}
                          className="flex flex-col items-center flex-1 min-w-0 px-1"
                        >
                          <span
                            className="relative z-10 mb-4 flex h-[32px] w-[32px] items-center justify-center rounded-full border-2 border-[#e6c47a] bg-[#18181b] text-[#e6c47a] text-[11px] font-bold"
                            style={{ boxShadow: "0 0 18px #e6c47a55" }}
                          >
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="text-center text-[#c4c4c8] text-sm leading-snug max-w-[7.5rem]">
                            {step}
                          </span>
                        </li>
                      ))}
                    </div>
                  </ol>
                </div>
                <div className={`${cardClass} mt-3`}>
                  <h2 className="text-[#e6c47a] text-sm tracking-wide mb-3 font-semibold">
                    Combined Disciplines
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {combinedServices.map((item) => (
                      <span
                        key={item}
                        className="text-sm sm:text-base text-[#c4c4c8] border border-[#e6c47a]/20 rounded-lg px-2.5 py-1"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div className={`${cardClass} mt-3`}>
                  <h2 className="text-[#e6c47a] text-sm tracking-wide mb-3 font-semibold">
                    Skills
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((item) => (
                      <span
                        key={item}
                        className="text-sm sm:text-base text-[#c4c4c8] border border-[#e6c47a]/20 rounded-lg px-2.5 py-1"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
            </div>

            <div
              role="tabpanel"
              id="panel-intensives"
              aria-labelledby="tab-intensives"
              hidden={activeTab !== "intensives"}
            >
                <div className="grid lg:grid-cols-[1.2fr_1fr] gap-4">
                  <div className={`${cardClass} border-[#e6c47a]/45`}>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-5">
                      <h2 className="text-xl sm:text-2xl font-bold text-white">
                        Web & Digital Marketing Consulting
                      </h2>
                      <p className="text-[#e6c47a] text-3xl font-extrabold shrink-0">
                        $1,250
                      </p>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="rounded-lg border border-[#e6c47a]/20 bg-[#18181b]/40 p-4">
                        <h3 className="text-[#e6c47a] text-sm font-semibold mb-1">Strategy</h3>
                        <p className="text-[#a1a1aa] text-sm mb-3 leading-snug">
                          Direction, priorities, and decision support
                        </p>
                        <ul className="space-y-2">
                          {intensiveStrategy.map((item) => (
                            <li key={item} className="text-[#c4c4c8] text-base leading-snug">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg border border-[#e6c47a]/20 bg-[#18181b]/40 p-4">
                        <h3 className="text-[#e6c47a] text-sm font-semibold mb-1">Deliverables</h3>
                        <p className="text-[#a1a1aa] text-sm mb-3 leading-snug">
                          Hands-on outputs and executed work
                        </p>
                        <ul className="space-y-2">
                          {intensiveDeliverables.map((item) => (
                            <li key={item} className="text-[#c4c4c8] text-base leading-snug">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className={cardClass}>
                    <h3 className="text-[#e6c47a] text-sm tracking-wide mb-3 font-semibold">
                      Common Uses
                    </h3>
                    <ul className="space-y-2">
                      {dayRateExamples.map((item) => (
                        <li key={item} className="text-[#c4c4c8] text-base border-b border-[#e6c47a]/10 pb-2 last:border-0 last:pb-0">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
            </div>

            <div
              role="tabpanel"
              id="panel-retainers"
              aria-labelledby="tab-retainers"
              hidden={activeTab !== "retainers"}
            >
                <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
                  {retainers.map((tier, i) => {
                    const selected = activeRetainer === i;
                    return (
                      <button
                        key={tier.name}
                        type="button"
                        onClick={() => setActiveRetainer(i)}
                        className={`text-left cursor-pointer ${selected ? cardActiveClass : cardClass} hover:border-[#e6c47a]/50`}
                        style={{ minWidth: "auto", minHeight: "auto" }}
                      >
                        <p
                          className="text-white font-semibold text-sm sm:text-base mb-1 leading-snug"
                        >
                          {tier.name}
                        </p>
                        <p
                          className="text-[#e6c47a] text-lg sm:text-xl font-extrabold"
                        >
                          {tier.price}
                          <span className="text-xs sm:text-sm font-semibold text-[#a1a1aa] ml-0.5">/mo</span>
                        </p>
                      </button>
                    );
                  })}
                </div>
                {retainers.map((tier, i) => (
                  <div
                    key={tier.name}
                    className={cardClass}
                    hidden={activeRetainer !== i}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-1">
                          {tier.name}
                        </h2>
                        <p className="text-[#c4c4c8] text-base mb-1">{tier.positioning}</p>
                        <p className="text-[#a1a1aa] text-base">{tier.bestFor}</p>
                      </div>
                      <div className="shrink-0 sm:text-right">
                        <p className="text-[#e6c47a] text-3xl font-extrabold">
                          {tier.price}
                          <span className="text-base font-semibold text-[#a1a1aa] ml-1">/mo</span>
                        </p>
                        <p className="text-[#e6c47a]/80 text-sm font-semibold mt-1">{tier.capacity}</p>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="rounded-lg border border-[#e6c47a]/20 bg-[#18181b]/40 p-4">
                        <h3 className="text-[#e6c47a] text-sm font-semibold mb-1">Strategy</h3>
                        <p className="text-[#a1a1aa] text-sm mb-3 leading-snug">
                          Direction, priorities, and decision support
                        </p>
                        <ul className="space-y-2">
                          {tier.strategy.map((item) => (
                            <li key={item} className="text-[#c4c4c8] text-base leading-snug">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg border border-[#e6c47a]/20 bg-[#18181b]/40 p-4">
                        <h3 className="text-[#e6c47a] text-sm font-semibold mb-1">Deliverables</h3>
                        <p className="text-[#a1a1aa] text-sm mb-3 leading-snug">
                          Hands-on outputs and executed work
                        </p>
                        <ul className="space-y-2">
                          {tier.deliverables.map((item) => (
                            <li key={item} className="text-[#c4c4c8] text-base leading-snug">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            <div
              role="tabpanel"
              id="panel-projects"
              aria-labelledby="tab-projects"
              hidden={activeTab !== "projects"}
            >
                <div
                  role="tablist"
                  aria-label="Project categories"
                  className="flex flex-wrap gap-2 mb-5"
                >
                  {projectSections.map((section) => {
                    const selected = activeProjectSection === section.id;
                    return (
                      <button
                        key={section.id}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        id={`project-tab-${section.id}`}
                        aria-controls={`project-panel-${section.id}`}
                        onClick={() => setActiveProjectSection(section.id)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold border transition ${
                          selected
                            ? "border-[#e6c47a] bg-[#e6c47a]/15 text-[#e6c47a]"
                            : "border-[#e6c47a]/25 text-[#a1a1aa] hover:text-white hover:border-[#e6c47a]/50"
                        }`}
                        style={{ minWidth: "auto", minHeight: "auto" }}
                      >
                        {section.label}
                      </button>
                    );
                  })}
                </div>

                {projectSections.map((section) => (
                  <div
                    key={section.id}
                    role="tabpanel"
                    id={`project-panel-${section.id}`}
                    aria-labelledby={`project-tab-${section.id}`}
                    hidden={activeProjectSection !== section.id}
                  >
                    <h2 className="sr-only">{section.label}</h2>
                    <div
                      className={`grid gap-2 sm:gap-3 mb-4 ${
                        section.items.length === 1
                          ? "grid-cols-1 sm:grid-cols-2"
                          : "grid-cols-2 lg:grid-cols-3"
                      }`}
                    >
                      {section.items.map((row) => (
                        <div key={row.project} className={cardClass}>
                          <h3 className="text-[#c4c4c8] text-sm sm:text-base mb-2 leading-snug font-normal">
                            {row.project}
                          </h3>
                          <p className="text-[#e6c47a] text-base sm:text-lg font-extrabold">
                            {row.range}
                            <span className="ml-1 text-[10px] sm:text-xs font-semibold text-[#a1a1aa]">
                              /Starting Rate
                            </span>
                          </p>
                        </div>
                      ))}
                    </div>

                    {section.id === "websites" && (
                      <div className="grid sm:grid-cols-2 gap-3 mb-4">
                        <div className={cardClass}>
                          <p className="text-[#a1a1aa] text-xs tracking-wide mb-1">Basic Website</p>
                          <h3 className="text-lg font-bold text-white mb-1">
                            Design & Development
                          </h3>
                          <p className="text-[#e6c47a] text-3xl font-extrabold mb-2">
                            $6,000
                            <span className="ml-1 text-xs font-semibold text-[#a1a1aa]">
                              /Starting Rate
                            </span>
                          </p>
                          <p className="text-[#a1a1aa] text-sm leading-relaxed">
                            Website design and development as a standalone deliverable.
                          </p>
                        </div>
                        <div className={`${cardClass} border-[#e6c47a]/50`}>
                          <p className="text-[#e6c47a] text-xs tracking-wide mb-1">Growth-Focused</p>
                          <h3 className="text-lg font-bold text-white mb-1">
                            Business Growth System
                          </h3>
                          <p className="text-[#e6c47a] text-3xl font-extrabold mb-2">
                            $10,000
                            <span className="ml-1 text-xs font-semibold text-[#a1a1aa]">
                              /Starting Rate
                            </span>
                          </p>
                          <p className="text-[#a1a1aa] text-sm leading-relaxed">
                            Strategy, custom site, SEO, analytics, lead gen, and launch support.
                          </p>
                        </div>
                      </div>
                    )}

                    {(section.id === "websites" || section.id === "custom") && (
                      <div className={cardClass}>
                        <h3 className="text-[#e6c47a] text-sm tracking-wide mb-3 font-semibold">
                          What Drives Pricing
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {complexityFactors.map((item) => (
                            <span
                              key={item}
                              className="text-sm text-[#c4c4c8] border border-[#e6c47a]/20 rounded-lg px-2 py-1"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {section.id === "systems" && (
                      <div className={cardClass}>
                        <h3 className="text-[#e6c47a] text-sm tracking-wide mb-3 font-semibold">
                          What Drives Pricing
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {systemsComplexityFactors.map((item) => (
                            <span
                              key={item}
                              className="text-sm text-[#c4c4c8] border border-[#e6c47a]/20 rounded-lg px-2 py-1"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>

            <div
              role="tabpanel"
              id="panel-terms"
              aria-labelledby="tab-terms"
              hidden={activeTab !== "terms"}
            >
                <h2 className="sr-only">Terms</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className={cardClass}>
                    <h3 className="text-base font-semibold text-white mb-3">
                      Projects Under ~$10k
                    </h3>
                    <ol className="space-y-2.5 text-[#c4c4c8] text-base">
                      <li className="flex gap-2"><span className="text-[#e6c47a] font-bold">50%</span> to begin</li>
                      <li className="flex gap-2"><span className="text-[#e6c47a] font-bold">25%</span> after design approval</li>
                      <li className="flex gap-2"><span className="text-[#e6c47a] font-bold">25%</span> before launch</li>
                    </ol>
                    <p className="text-[#a1a1aa] text-sm mt-3">Smaller projects: 50% / 50%</p>
                  </div>
                  <div className={cardClass}>
                    <h3 className="text-base font-semibold text-white mb-3">
                      Project Terms
                    </h3>
                    <ul className="space-y-2">
                      {projectTerms.map((item) => (
                        <li key={item} className="flex gap-2 text-[#c4c4c8] text-sm sm:text-base">
                          <span className="text-[#e6c47a] shrink-0">—</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={`${cardClass} sm:col-span-2 lg:col-span-1`}>
                    <h3 className="text-base font-semibold text-white mb-3">
                      Retainer Terms
                    </h3>
                    <ul className="space-y-2">
                      {retainerTerms.map((item) => (
                        <li key={item} className="flex gap-2 text-[#c4c4c8] text-sm sm:text-base">
                          <span className="text-[#e6c47a] shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-[#e6c47a]" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
            </div>
          </div>

          <footer className="mt-10 pt-6 border-t border-[#e6c47a]/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-base text-[#a1a1aa]">
            <Link href="/" className="hover:text-[#e6c47a] transition tracking-wide uppercase text-sm font-semibold">
              ← Back to portfolio
            </Link>
            <a href="mailto:tangs.email@gmail.com" className="hover:text-[#e6c47a] transition">
              tangs.email@gmail.com
            </a>
          </footer>
        </div>
      </main>
    </div>
  );
}
