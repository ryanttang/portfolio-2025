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
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
