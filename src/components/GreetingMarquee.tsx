import React from "react";

const jobTitles = [
  "Digital Marketer",
  "Creative Director",
  "Web Developer",
  "AI Specialist",
  "Web Designer",
  "Ecommerce Specialist",
];

export default function BottomMarquee() {
  // Repeat the titles for seamless scroll
  const repeated = [...jobTitles, ...jobTitles];
  return (
    <div className="fixed bottom-0 left-0 w-full z-[100] bg-[#18181b]/70 border-t border-[#e6c47a]/60 backdrop-blur-md shadow-lg overflow-hidden h-12 flex items-center">
      <div className="marquee-track flex whitespace-nowrap animate-marquee items-center">
        {repeated.map((title, i) => (
          <React.Fragment key={i}>
            <span
              className="mx-4 text-base md:text-xl font-semibold tracking-widest uppercase text-[#e6c47a] font-syne drop-shadow-lg"
              style={{ letterSpacing: "0.18em", textShadow: "0 2px 8px #18181b, 0 0 2px #e6c47a55" }}
            >
              {title}
            </span>
            {/* Add separator unless last item */}
            {i !== repeated.length - 1 && (
              <span className="text-[#e6c47a]/70 text-lg md:text-xl mx-1 align-middle" aria-hidden="true">&bull;</span>
            )}
          </React.Fragment>
        ))}
      </div>
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 18s linear infinite;
        }
        .marquee-track {
          min-width: 200%;
        }
      `}</style>
    </div>
  );
} 