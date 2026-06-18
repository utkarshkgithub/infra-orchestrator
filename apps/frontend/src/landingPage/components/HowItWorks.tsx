import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const STEPS = [
  {
    verb: "Push",
    description: "Connect your repository. Every push to main triggers a new build automatically.",
    detail: "git push origin main",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 3v12M12 3L8 7M12 3L16 7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 17h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        <path d="M5 21h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeOpacity="0.3" />
      </svg>
    ),
  },
  {
    verb: "Build",
    description: "Static assets are compiled, optimized, and validated in an isolated container.",
    detail: "npm run build",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11 4.5-.85 8-5.75 8-11V6L12 2Z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    verb: "Ship",
    description: "Assets distributed globally across the edge network. Your URL is live in seconds.",
    detail: "yoursite.shipwebsite.tech",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
        <path d="M3 12h18M12 3c-2 2.5-3 5.5-3 9s1 6.5 3 9M12 3c2 2.5 3 5.5 3 9s-1 6.5-3 9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Keep this section stable first; animate only after the layout is confirmed working.
    const ctx = gsap.context(() => {}, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="process"
      className="relative py-28 sm:py-32"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(200,255,60,0.22) 50%, transparent 100%)",
        }}
      />

      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        <div className="mx-auto mb-20 max-w-2xl text-center">
          <span className="mb-3 block font-mono text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-[#6B7084]">
            Process
          </span>
          <h2 className="text-balance font-serif text-[clamp(2.4rem,5vw,4.8rem)] font-normal leading-[0.95] tracking-[-0.05em] text-[#E8E6E1]">
            Three verbs.
            <br />
            <em style={{ fontStyle: "italic", color: "#C8FF3C" }}>Zero friction.</em>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#6B7084] sm:text-base">
            Designed to disappear. You focus on building — shipwebsite handles the rest.
          </p>
        </div>

        <div className="relative">
          <div className="relative z-10 grid gap-6 lg:grid-cols-3">
            {STEPS.map((s, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-2xl border border-[rgba(232,230,225,0.08)] bg-[#1A1C25] p-8 transition-all duration-300 hover:-translate-y-0.5 hover:border-[rgba(232,230,225,0.14)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.3)]"
              >
                <div
                  className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-[rgba(200,255,60,0.15)] bg-[rgba(200,255,60,0.06)] text-[#C8FF3C]"
                  aria-hidden="true"
                >
                  {s.icon}
                </div>

                <h3 className="mb-3 font-serif text-2xl text-[#E8E6E1]">
                  {s.verb}
                </h3>

                <p className="mb-6 text-sm leading-[1.7] text-[#6B7084]">
                  {s.description}
                </p>

                <div className="rounded-lg border border-[rgba(232,230,225,0.06)] bg-[#08090E] px-4 py-2.5">
                  <span className="font-mono text-xs text-[#C8FF3C]">
                    {s.detail}
                  </span>
                </div>

                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-40"
                  aria-hidden="true"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 0%, rgba(200,255,60,0.35) 50%, transparent 100%)",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}