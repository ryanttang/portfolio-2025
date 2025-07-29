import type { Metadata, Viewport } from "next";
import { Syne, Space_Grotesk, Rajdhani, Audiowide, Major_Mono_Display, Saira, VT323, Rubik_Mono_One, Bungee, Exo } from "next/font/google";
import "./globals.css";
import AppShell from "../components/AppShell";

const syne = Syne({ variable: "--font-syne", subsets: ["latin"], display: "swap" });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"], display: "swap" });
const rajdhani = Rajdhani({ variable: "--font-rajdhani", subsets: ["latin"], display: "swap", weight: ["400", "500", "600", "700"] });
const audiowide = Audiowide({ variable: "--font-audiowide", subsets: ["latin"], display: "swap", weight: "400" });
const majorMono = Major_Mono_Display({ variable: "--font-major-mono", subsets: ["latin"], display: "swap", weight: "400" });
const saira = Saira({ variable: "--font-saira", subsets: ["latin"], display: "swap", weight: ["400", "500", "600", "700"] });
const vt323 = VT323({ variable: "--font-vt323", subsets: ["latin"], display: "swap", weight: "400" });
const rubikMono = Rubik_Mono_One({ variable: "--font-rubik-mono", subsets: ["latin"], display: "swap", weight: "400" });
const bungee = Bungee({ variable: "--font-bungee", subsets: ["latin"], display: "swap", weight: "400" });
const exo = Exo({ variable: "--font-exo", subsets: ["latin"], display: "swap", weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Ryan Tang | Designer, Developer, Creative Direction",
  description: "West Coast based designer, developer, and creative director with expertise in UX/UI design, web development, and creative direction. Portfolio showcasing innovative digital experiences.",
  keywords: [
    "Ryan Tang",
    "UX Designer",
    "Web Developer", 
    "Creative Director",
    "UI/UX Design",
    "Web Development",
    "Creative Direction",
    "Digital Design",
    "Portfolio",
    "West Coast Designer",
    "React Developer",
    "Next.js Developer",
    "TypeScript Developer",
    "Frontend Developer",
    "Design Systems",
    "User Experience",
    "User Interface",
    "Creative Technology"
  ],
  authors: [{ name: "Ryan Tang" }],
  creator: "Ryan Tang",
  publisher: "Ryan Tang",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://ryantang.site'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Ryan Tang | Designer, Developer, Creative Direction",
    description: "West Coast based designer, developer, and creative director with expertise in UX/UI design, web development, and creative direction.",
    url: 'https://ryantang.site',
    siteName: 'Ryan Tang Portfolio',
    images: [
      {
        url: '/headshot.png',
        width: 1200,
        height: 630,
        alt: 'Ryan Tang - Designer, Developer, Creative Director',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Ryan Tang | Designer, Developer, Creative Direction",
    description: "West Coast based designer, developer, and creative director with expertise in UX/UI design, web development, and creative direction.",
    images: ['/headshot.png'],
    creator: '@ryantang',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
  category: 'technology',
  classification: 'Portfolio',
  other: {
    'theme-color': '#000000',
    'msapplication-TileColor': '#000000',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Ryan Tang Portfolio',
    'application-name': 'Ryan Tang Portfolio',
    'msapplication-config': '/browserconfig.xml',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Ryan Tang",
    "jobTitle": "Designer, Developer, Creative Director",
    "url": "https://ryantang.site",
    "image": "https://ryantang.site/headshot.png",
    "description": "West Coast based designer, developer, and creative director with expertise in UX/UI design, web development, and creative direction.",
    "sameAs": [
      "https://linkedin.com/in/ryantang",
      "https://github.com/ryantang"
    ],
    "knowsAbout": [
      "UX/UI Design",
      "Web Development", 
      "Creative Direction",
      "React",
      "Next.js",
      "TypeScript",
      "Design Systems",
      "User Experience",
      "Creative Technology"
    ],
    "worksFor": {
      "@type": "Organization",
      "name": "Freelance"
    },
    "address": {
      "@type": "PostalAddress",
      "addressRegion": "West Coast",
      "addressCountry": "US"
    }
  };

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#000000" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="theme-color" content="#000000" />
        
        {/* Additional SEO Meta Tags */}
        <meta name="author" content="Ryan Tang" />
        <meta name="copyright" content="Ryan Tang" />
        <meta name="language" content="English" />
        <meta name="revisit-after" content="7 days" />
        <meta name="distribution" content="global" />
        <meta name="rating" content="general" />
        <meta name="coverage" content="worldwide" />
        <meta name="target" content="all" />
        <meta name="HandheldFriendly" content="true" />
        <meta name="MobileOptimized" content="width" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Ryan Tang Portfolio" />
        <meta name="application-name" content="Ryan Tang Portfolio" />
        <meta name="msapplication-TileImage" content="/favicon-32x32.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Social Media Meta Tags */}
        <meta property="og:site_name" content="Ryan Tang Portfolio" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Ryan Tang - Designer, Developer, Creative Director" />
        
        {/* Twitter Additional Meta Tags */}
        <meta name="twitter:site" content="@ryantang" />
        <meta name="twitter:creator" content="@ryantang" />
        <meta name="twitter:image:alt" content="Ryan Tang - Designer, Developer, Creative Director" />
        
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-GEN1KNZPSP"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-GEN1KNZPSP');
            `,
          }}
        />
        
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-MZ7T3Q5R');
            `,
          }}
        />
        {/* End Google Tag Manager */}
      </head>
      <body
        className={[
          syne.variable,
          spaceGrotesk.variable,
          rajdhani.variable,
          audiowide.variable,
          majorMono.variable,
          saira.variable,
          vt323.variable,
          rubikMono.variable,
          bungee.variable,
          exo.variable,
          "antialiased"
        ].join(" ")}
        style={{ fontFamily: 'var(--font-space-grotesk), Arial, sans-serif' }}
      >
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe 
            src="https://www.googletagmanager.com/ns.html?id=GTM-MZ7T3Q5R"
            height="0" 
            width="0" 
            style={{display:'none',visibility:'hidden'}}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        
        {/* Vanta.js Script */}
        <script src="/dist/vanta.rings.min.js" defer></script>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
