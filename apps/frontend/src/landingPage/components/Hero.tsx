import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { getGithubAuthUrl } from "../../lib/api";

const TYPED_LINES = [
  { text: "$ git push origin main", type: "cmd" },
  { text: "  Building static assets...", type: "out" },
  { text: "  Optimizing for production...", type: "out" },
  { text: "  Deploying to edge network...", type: "out" },
  { text: "  ✓ Live at shipwebsite.tech", type: "success" },
];

function TypingLine({
  text,
  delay,
  onDone,
}: {
  text: string;
  delay: number;
  onDone?: () => void;
}) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    let intervalId: ReturnType<typeof window.setInterval> | undefined;
    let charIndex = 0;

    const timeoutId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        charIndex += 1;
        setDisplayed(text.slice(0, charIndex));

        if (charIndex >= text.length) {
          if (intervalId !== undefined) {
            window.clearInterval(intervalId);
          }
          setDone(true);
          onDoneRef.current?.();
        }
      }, 24);
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }
    };
  }, [text, delay]);

  return (
    <div
      className={`flex items-center gap-1 ${
        done && text.includes("✓") ? "text-phosphor font-medium" : ""
      }`}
    >
      <span>{displayed}</span>
      {!done && (
        <span className="inline-block h-3.5 w-1.75 rounded-[1px] bg-phosphor align-middle animate-blink" />
      )}
    </div>
  );
}

export default function Hero() {
  const githubAuthUrl = getGithubAuthUrl();
  const heroRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const advanceTimerRef = useRef<number | null>(null);
  const [activeLines, setActiveLines] = useState(1);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(headlineRef.current, { y: 50, opacity: 0, duration: 1.1 }, 0.15)
        .from(subRef.current!, { y: 28, opacity: 0, duration: 0.9 }, 0.45)
        .from(ctaRef.current!, { y: 20, opacity: 0, duration: 0.8 }, 0.65)
        .from(terminalRef.current!, { y: 40, opacity: 0, duration: 1.1 }, 0.8);
    }, heroRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current !== null)
        window.clearTimeout(advanceTimerRef.current);
    };
  }, []);

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative flex min-h-screen flex-col justify-center overflow-hidden pb-16 pt-32 sm:pb-20 sm:pt-40 lg:pb-24 lg:pt-44"
    >
      {/* Background gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(200,255,60,0.06), transparent 60%)",
        }}
        aria-hidden="true"
      />

      {/* Signature: Deployment Beam */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 bottom-0 w-px overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute inset-0 h-20 w-px animate-beam-pulse bg-gradient-to-b from-transparent via-phosphor to-transparent" />
        <div className="absolute left-[-20px] h-20 w-[41px] animate-beam-pulse bg-[radial-gradient(ellipse_at_center,rgba(200,255,60,0.15),transparent_70%)]" />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-14 px-6 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-20 lg:px-10">
        {/* Left: Copy */}
        <div className="max-w-2xl">
          <div ref={headlineRef} className="mb-7">
            <h1 className="font-serif text-[clamp(2.75rem,6vw,5rem)] font-normal leading-[1.05] tracking-[-0.02em] text-bone">
              Ship your site.
              <br />
              <em className="text-phosphor" style={{ fontStyle: "italic" }}>
                Not your patience.
              </em>
            </h1>
          </div>

          <p
            ref={subRef}
            className="max-w-lg text-[1.0625rem] leading-[1.7] text-ash"
          >
            Zero-config deployment for static builds. Push code, get a live URL.
            No servers to manage, no YAML to write, no patience required.
          </p>

          <div ref={ctaRef} className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href={githubAuthUrl}
              id="hero-cta-primary"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-phosphor px-8 py-3.5 font-sans text-[0.9375rem] font-semibold tracking-[-0.01em] text-void transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(200,255,60,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-phosphor focus-visible:ring-offset-4 focus-visible:ring-offset-void"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 0C5.373 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.49 11.49 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.799 24 17.302 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              Continue with GitHub
            </a>
            <a
              href="#process"
              id="hero-cta-secondary"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[rgba(232,230,225,0.14)] px-7 py-3.5 font-sans text-[0.9375rem] font-medium text-bone transition-all duration-200 hover:-translate-y-0.5 hover:border-phosphor hover:text-phosphor focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-phosphor focus-visible:ring-offset-4 focus-visible:ring-offset-void"
            >
              See how it works
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.8125rem] text-ash">
            <span className="flex items-center gap-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="text-phosphor"
              >
                <path
                  d="M2 7l3.5 3.5L12 3"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              No credit card
            </span>
            <span className="flex items-center gap-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="text-phosphor"
              >
                <path
                  d="M2 7l3.5 3.5L12 3"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Free tier included
            </span>
            <span className="flex items-center gap-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="text-phosphor"
              >
                <path
                  d="M2 7l3.5 3.5L12 3"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Deploy in 60 seconds
            </span>
          </div>
        </div>

        {/* Right: Terminal */}
        <div
          ref={terminalRef}
          className="relative w-full overflow-hidden rounded-2xl border border-[rgba(232,230,225,0.08)] bg-void-warm shadow-[0_0_0_1px_rgba(200,255,60,0.04),0_24px_64px_rgba(0,0,0,0.5),0_0_120px_rgba(200,255,60,0.03)] before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(135deg,rgba(200,255,60,0.04)_0%,transparent_40%,transparent_60%,rgba(200,255,60,0.02)_100%)] before:content-[''] lg:max-w-140 lg:justify-self-end"
        >
          <div className="flex items-center gap-3 border-b border-[rgba(232,230,225,0.08)] bg-[rgba(255,255,255,0.02)] px-5 py-4">
            <div className="flex gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
            </div>
          </div>

          <div className="min-h-[280px] px-7 py-7 font-mono text-[0.8125rem] leading-8 text-ash">
            {TYPED_LINES.slice(0, activeLines).map((line, lineIndex) => (
              <TypingLine
                key={lineIndex}
                text={line.text}
                delay={0}
                onDone={() => {
                  if (lineIndex + 1 < TYPED_LINES.length) {
                    if (advanceTimerRef.current !== null)
                      window.clearTimeout(advanceTimerRef.current);
                    advanceTimerRef.current = window.setTimeout(() => {
                      setActiveLines((c) => Math.max(c, lineIndex + 2));
                    }, 120);
                  }
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2.5 border-t border-[rgba(232,230,225,0.06)] bg-[rgba(200,255,60,0.03)] px-7 py-3.5">
            <span className="relative h-2 w-2 rounded-full bg-phosphor">
              <span className="absolute -inset-1 animate-pulse-ring rounded-full bg-[rgba(200,255,60,0.3)]" />
            </span>
            <span className="flex-1 font-mono text-sm text-ash">
              shipwebsite.tech
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
