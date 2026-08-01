import type { Metadata } from "next";
import HelloPageClient from "@/components/HelloPageClient";
import { getContent } from "@/lib/content";
import { getDefaultContent } from "@/lib/content/defaults";
import { helloSchema, type HelloContent } from "@/lib/content/schemas";

const title = "Hello | Ryan Tang";
const description =
  "Digital & marketing strategy, branding, websites, retainers, and consulting from Ryan Tang — a quick overview for small independent businesses.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "Ryan Tang",
    "digital marketing strategist",
    "website design",
    "branding",
    "SEO",
    "marketing consulting",
    "small business",
  ],
  alternates: {
    canonical: "/hello",
  },
  openGraph: {
    title,
    description:
      "Strategy · Branding · Websites · Marketing · Automation · AI · Analytics. A quick look at how I help independent businesses grow.",
    url: "/hello",
    siteName: "Ryan Tang Portfolio",
    type: "website",
    locale: "en_US",
  },
};

function loadHelloContent(raw: unknown): HelloContent {
  const parsed = helloSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  return helloSchema.parse(getDefaultContent("hello"));
}

export default async function HelloPage() {
  const raw = await getContent("hello");
  return <HelloPageClient content={loadHelloContent(raw)} />;
}
