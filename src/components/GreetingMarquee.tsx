import React, { useEffect, useState } from "react";

const greetings = [
  "hey.",
  "what's up.",
  "hello.",
  "howdy.",
  "welcome.",
  "你好.",
  "こんにちは.",
  "안녕하세요.",
];

function useTypewriter(words: string[], speed = 60, pause = 1200) {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (typing) {
      if (displayed.length < words[index].length) {
        timeout = setTimeout(() => {
          setDisplayed(words[index].slice(0, displayed.length + 1));
        }, speed);
      } else {
        setTyping(false);
        timeout = setTimeout(() => setTyping(true), pause);
      }
    } else {
      timeout = setTimeout(() => {
        setDisplayed("");
        setIndex((i) => (i + 1) % words.length);
      }, 400);
    }
    return () => clearTimeout(timeout);
  }, [displayed, typing, words, index, speed, pause]);

  return displayed;
}

export default function GreetingTypewriter() {
  const text = useTypewriter(greetings, 60, 1200);
  return (
    <div className="flex justify-center items-center w-full mt-2 mb-2 min-h-[32px]">
      <span className="text-lg md:text-xl font-semibold tracking-widest uppercase text-[#e6c47a] font-syne drop-shadow-lg" style={{ letterSpacing: "0.14em", textShadow: "0 2px 8px #18181b, 0 0 2px #e6c47a55" }}>
        {text}
        <span className="inline-block w-2 h-5 bg-[#e6c47a] ml-1 animate-pulse align-bottom" style={{ borderRadius: 2, verticalAlign: 'bottom' }} />
      </span>
    </div>
  );
}

const jobTitles = [
  "Digital Marketer",
  "Creative Director",
  "Web Developer",
  "AI Specialist",
  "Web Designer",
  "Ecommerce Specialist",
  "DJ"
];

export function BottomMarquee() {
  // Repeat the titles for seamless scroll
  const repeated = [...jobTitles, ...jobTitles, ...jobTitles]; // triple for extra buffer
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
            {(i !== repeated.length - 1) && (
              <span className="text-[#e6c47a]/70 text-lg md:text-xl mx-1 align-middle" aria-hidden="true">&bull;</span>
            )}
          </React.Fragment>
        ))}
      </div>
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.3333%); }
        }
        .animate-marquee {
          animation: marquee 18s linear infinite;
        }
        .marquee-track {
          min-width: 300%;
        }
      `}</style>
    </div>
  );
} 