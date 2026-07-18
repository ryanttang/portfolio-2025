import type { Metadata } from "next";
import ServicesPageClient from "@/components/ServicesPageClient";

export const metadata: Metadata = {
  title: "Services & Pricing | Ryan Tang",
  description:
    "Digital & Marketing Strategist. I design and build digital systems that help businesses grow. Strategy, branding, websites, marketing, automation, AI, and analytics.",
  alternates: {
    canonical: "/services",
  },
  openGraph: {
    title: "Services & Pricing | Ryan Tang",
    description:
      "Digital & Marketing Strategist. Strategy · Branding · Websites · Marketing · Automation · AI · Analytics.",
    url: "https://ryantang.site/services",
  },
};

export default function ServicesPage() {
  return <ServicesPageClient />;
}
