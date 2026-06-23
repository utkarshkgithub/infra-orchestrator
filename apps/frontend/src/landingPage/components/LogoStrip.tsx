import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const STACKS = [
  { name: "React", icon: "⬡" },
  { name: "Vue", icon: "◈" },
  { name: "Next.js", icon: "▲" },
  { name: "Astro", icon: "◉" },
  { name: "Svelte", icon: "◆" },
  { name: "Nuxt", icon: "◎" },
  { name: "Vite", icon: "⚡" },
  { name: "Gatsby", icon: "◧" },
  { name: "Hugo", icon: "◇" },
  { name: "Remix", icon: "◐" },
];

export default function LogoStrip() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(sectionRef.current!, {
        scrollTrigger: { trigger: sectionRef.current, start: "top 90%" },
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const items = [...STACKS, ...STACKS];

  return (
    <div
      ref={sectionRef}
      className="border-y border-[rgba(232,230,225,0.05)] py-12 overflow-hidden"
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        <p className="mb-8 text-center font-mono text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-ash">
          Works with every static framework
        </p>
      </div>

      <div className="relative overflow-hidden">
        {/* Fade masks */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-linear-to-r from-void to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-linear-to-l from-void to-transparent" />

        <div className="flex w-max gap-4 animate-logo-scroll">
          {items.map((s, i) => (
            <div
              key={i}
              className="inline-flex shrink-0 items-center gap-2.5 rounded-lg border border-[rgba(232,230,225,0.06)] bg-[rgba(26,28,37,0.5)] px-5 py-2.5 transition-colors duration-200 hover:border-[rgba(200,255,60,0.15)] hover:bg-[rgba(200,255,60,0.04)]"
            >
              <span className="text-base leading-none text-phosphor">
                {s.icon}
              </span>
              <span className="font-sans text-sm font-medium text-ash">
                {s.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
