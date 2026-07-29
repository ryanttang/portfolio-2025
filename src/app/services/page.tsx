import type { Metadata } from "next";
import ServicesPageClient from "@/components/ServicesPageClient";

const title = "Services & Pricing | Ryan Tang";
const description =
  "Digital & marketing strategy, branding, websites, retainers, and consulting from Ryan Tang. Clear starting rates for audits, custom sites, SEO, automation, and ongoing support.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "Ryan Tang services",
    "digital marketing strategist",
    "website design pricing",
    "branding packages",
    "SEO services",
    "marketing retainer",
    "web development",
    "marketing consulting",
    "automation and analytics",
  ],
  alternates: {
    canonical: "/services",
  },
  openGraph: {
    title,
    description:
      "Strategy · Branding · Websites · Marketing · Automation · AI · Analytics. Clear starting rates for projects, retainers, and consulting.",
    url: "/services",
    siteName: "Ryan Tang Portfolio",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-services.png",
        width: 1200,
        height: 630,
        alt: "Ryan Tang — Services & Pricing | Digital & Marketing Strategist",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description:
      "Strategy · Branding · Websites · Marketing · Automation · AI · Analytics. Projects, retainers, and consulting with clear starting rates.",
    images: ["/og-services.png"],
    creator: "@ryantang",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const servicesStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://ryantang.site/services#webpage",
      url: "https://ryantang.site/services",
      name: title,
      description,
      isPartOf: {
        "@type": "WebSite",
        "@id": "https://ryantang.site/#website",
        name: "Ryan Tang Portfolio",
        url: "https://ryantang.site",
      },
      about: { "@id": "https://ryantang.site/services#business" },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: "https://ryantang.site/og-services.png",
      },
    },
    {
      "@type": "ProfessionalService",
      "@id": "https://ryantang.site/services#business",
      name: "Ryan Tang — Digital & Marketing Strategy",
      url: "https://ryantang.site/services",
      image: "https://ryantang.site/og-services.png",
      description,
      email: "tangs.email@gmail.com",
      priceRange: "$1,250–$20,000+",
      areaServed: {
        "@type": "Country",
        name: "United States",
      },
      sameAs: [
        "https://linkedin.com/in/rttang",
        "https://github.com/ryanttang",
      ],
      provider: {
        "@type": "Person",
        name: "Ryan Tang",
        url: "https://ryantang.site",
        jobTitle: "Digital & Marketing Strategist",
      },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Services & Pricing",
        itemListElement: [
          {
            "@type": "OfferCatalog",
            name: "Consulting",
            itemListElement: [
              {
                "@type": "Offer",
                name: "Web & Digital Marketing Consulting",
                description:
                  "Up to six hours of consulting, marketing and digital ecosystem review, prioritized recommendations, 30-day action roadmap, and one follow-up call.",
                url: "https://ryantang.site/services",
                price: "1250",
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
              },
            ],
          },
          {
            "@type": "OfferCatalog",
            name: "Retainers",
            itemListElement: [
              {
                "@type": "Offer",
                name: "Digital Advisor Retainer",
                description:
                  "Strategy, consulting, analytics, and optimization — about 16 hours of access per month.",
                price: "2500",
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
                priceSpecification: {
                  "@type": "UnitPriceSpecification",
                  price: "2500",
                  priceCurrency: "USD",
                  billingDuration: "P1M",
                },
              },
              {
                "@type": "Offer",
                name: "Monthly Support Retainer",
                description:
                  "Strategy plus ongoing marketing execution — about 20–25 hours allocated per month.",
                price: "5000",
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
                priceSpecification: {
                  "@type": "UnitPriceSpecification",
                  price: "5000",
                  priceCurrency: "USD",
                  billingDuration: "P1M",
                },
              },
            ],
          },
          {
            "@type": "OfferCatalog",
            name: "Projects",
            itemListElement: [
              {
                "@type": "Offer",
                name: "Digital Marketing Audit",
                price: "1500",
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
              },
              {
                "@type": "Offer",
                name: "Full Marketing Strategy",
                price: "3500",
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
              },
              {
                "@type": "Offer",
                name: "Brand Identity Package",
                price: "3500",
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
              },
              {
                "@type": "Offer",
                name: "Landing Page",
                price: "2000",
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
              },
              {
                "@type": "Offer",
                name: "Small Business Website",
                price: "5000",
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
              },
              {
                "@type": "Offer",
                name: "Custom Marketing Website",
                price: "8000",
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
              },
              {
                "@type": "Offer",
                name: "E-Commerce Website",
                price: "10000",
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
              },
              {
                "@type": "Offer",
                name: "Website Redesign",
                price: "7500",
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
              },
              {
                "@type": "Offer",
                name: "SEO Optimization",
                price: "1500",
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
              },
              {
                "@type": "Offer",
                name: "SEO Foundation Project",
                price: "2500",
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
              },
              {
                "@type": "Offer",
                name: "Email/SMS Automation Setup",
                price: "2500",
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
              },
              {
                "@type": "Offer",
                name: "Marketing Dashboard",
                price: "2500",
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
              },
              {
                "@type": "Offer",
                name: "Custom Web Application",
                price: "20000",
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
              },
              {
                "@type": "Offer",
                name: "Business Growth System",
                description:
                  "Strategy, custom site, SEO, analytics, lead gen, and launch support.",
                price: "10000",
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
              },
            ],
          },
        ],
      },
    },
  ],
};

export default function ServicesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(servicesStructuredData),
        }}
      />
      <ServicesPageClient />
    </>
  );
}
