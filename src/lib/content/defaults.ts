export const defaultSettings: Record<string, unknown> = {
  brand: {
    name: "Ryan Tang",
    contactEmail: "tangs.email@gmail.com",
    resumeUrl: "/resume.pdf",
    socials: {
      linkedin: "https://www.linkedin.com/in/",
      github: "https://github.com/ryanttang",
      soundcloud: "https://soundcloud.com/",
    },
  },
  invoice: {
    sellerLegalName: "Ryan Tang",
    sellerAddress: "",
    sellerTaxId: "",
    sellerPaymentInstructions: "Pay via PayPal or as instructed on the invoice.",
    sellerFooterNote: "Thank you for your business.",
  },
  email: {
    fromName: "Ryan Tang",
    fromEmail: process.env.RESEND_FROM_EMAIL || "hello@ryantang.site",
    headerTitle: "Ryan Tang",
    headerTagline: "Design · Development · Creative Direction",
    headerBg: "#0c0c0c",
    accentColor: "#fdf0d5",
    logoUrl: "",
    signatureHtml: "<p>— Ryan Tang</p>",
    footerHtml: "",
    showSiteInFooter: true,
  },
  features: {
    contractSigning: true,
    paypalMode: "sandbox",
  },
};

export const defaultContent: Record<string, unknown> = {
  about: {
    headline: "Designer, Developer, Creative Direction",
    body: "West Coast based designer, developer, and creative director with expertise in UX/UI design, web development, and creative direction.",
  },
  projects: {
    items: [
      {
        title: "Cannagrab.App",
        description: "Cannabis discovery and deals platform.",
        url: "https://cannagrab.app",
        image: "/cannagrab-screen.png",
      },
      {
        title: "fivetwentyfour studios",
        description: "Creative studio site.",
        url: "#",
        image: "/524-screen.png",
      },
      {
        title: "DJ tangleton EPK",
        description: "Electronic press kit.",
        url: "#",
        image: "/tangleton-screen.png",
      },
      {
        title: "Catalyst Social Club",
        description: "Social club platform.",
        url: "#",
        image: "/catalyst-screen.png",
      },
      {
        title: "THC Members Only Club",
        description: "Members club platform.",
        url: "#",
        image: "/thcmembers-screen.png",
      },
    ],
  },
  design: {
    covers: [],
    flyers: [],
  },
  retail: {
    clients: [
      "Culture Cannabis Club",
      "Catalyst Cannabis Co",
      "Traditional Cannabis Co",
    ],
    personal: ["The Goodies Vault", "The Business Vault"],
  },
  services_overview: {
    groups: [
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
    ],
  },
  services_projects: {
    sections: [
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
    ],
  },
  services_retainers: {
    items: [
      {
        name: "Digital Advisor",
        price: "$2,500",
        positioning: "Strategy, consulting, analytics, and optimization",
      },
      {
        name: "Monthly Support",
        price: "$5,000",
        positioning: "Strategy plus ongoing marketing execution",
      },
    ],
  },
  services_terms: {
    projectPaymentLines: [
      "50% to begin",
      "25% after design approval",
      "25% before launch",
    ],
    projectPaymentNote: "Smaller projects: 50% / 50%",
    projectTerms: [
      "Two revision rounds included; additional revisions billed separately",
      "Client delays may shift the delivery timeline",
      "Out-of-scope requests require a change order",
      "Rush projects carry a 25–50% premium",
    ],
    retainerTerms: [
      "Paid at the beginning of each month",
      "Three-month initial commitment",
      "Defined monthly capacity",
      "Unused capacity expires",
      "Additional work billed at $150/hour or quoted separately",
      "30-day cancellation notice after the initial term",
    ],
  },
  hello: {
    greeting: {
      eyebrow: "Ryan Tang · Hello",
      headline: "Digital & Marketing Strategist",
      tagline: "I design and build digital systems that help businesses grow.",
      pillars:
        "Strategy • Branding • Websites • Marketing • Automation • AI • Analytics",
    },
    links: {
      linkedin: "https://linkedin.com/in/rttang",
      github: "https://github.com/ryanttang",
      email: "hello@ryantang.site",
      resumeUrl: "/RyanTangResume2025.png",
    },
    whoICanHelp: {
      title: "Who I Can Help",
      items: [
        "Independent shops, local storefronts, and restaurants",
        "Independents who grow through bookings and appointments",
        "Service businesses without an in-house marketing team",
        "Creators and founders launching or refreshing their brand",
        "Small teams that need strategy, web, and growth in one place",
        "Owners who want clear systems instead of one-off fixes",
      ],
    },
    lifecycle: [
      "Identify opportunities",
      "Develop the strategy",
      "Design the solution",
      "Build the technology",
      "Launch the marketing",
      "Measure performance",
      "Optimize continuously",
    ],
    skillGroups: [
      {
        skill: "Full Stack Development",
        disciplines: ["UX Strategy", "Web Design", "Development"],
      },
      {
        skill: "Campaigns & Automations",
        disciplines: [
          "Campaigns",
          "Email Capture",
          "Email/SMS Marketing",
          "Marketing Automation",
          "Retention",
          "Launch Strategy",
        ],
      },
      {
        skill: "Data & Analytics",
        disciplines: ["SEO", "Analytics", "Conversion Optimization"],
      },
      {
        skill: "Brand Development",
        disciplines: ["Graphic Design", "Copywriting"],
      },
    ],
    serviceSections: [
      {
        id: "strategy",
        label: "Strategy & Brand",
        items: [
          "Digital Marketing Audit",
          "Full Marketing Strategy",
          "Brand Identity Package",
        ],
      },
      {
        id: "websites",
        label: "Websites",
        items: [
          "Landing Page",
          "Small Business Website",
          "Custom Marketing Website",
          "E-Commerce Website",
          "Website Redesign",
          "SEO Optimization",
        ],
      },
      {
        id: "systems",
        label: "Systems & Growth",
        items: [
          "SEO Foundation Project",
          "Email/SMS Automation Setup",
          "Marketing Dashboard",
        ],
      },
      {
        id: "custom",
        label: "Custom Build",
        items: ["Custom Web Application"],
      },
    ],
    retainers: [
      {
        name: "Digital Advisor",
        summary:
          "Strategy, consulting, analytics, and optimization for teams with internal staff who need senior guidance.",
      },
      {
        name: "Monthly Support",
        summary:
          "Strategy plus ongoing marketing execution for businesses ready for consistent campaign and channel support.",
      },
    ],
    consulting: {
      title: "Strategy Intensive",
      summary:
        "Focused consulting to clarify priorities and next steps for your marketing and digital ecosystem.",
    },
    cta: {
      emailLabel: "Start a Conversation",
    },
  },
};

export function getDefaultContent(key: string): unknown {
  return defaultContent[key] ?? null;
}

export function getDefaultSetting(key: string): unknown {
  return defaultSettings[key] ?? null;
}
