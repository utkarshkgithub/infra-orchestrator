import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  {
    title: "Instant global CDN",
    description:
      "Static assets distributed to edge nodes worldwide the moment a build completes. No config, no origin servers.",
    stat: "<50ms",
    statLabel: "global latency",
    span: 2,
  },
  {
    title: "Atomic deploys",
    description:
      "Every deployment is immutable. Roll back to any previous build in one click.",
    stat: "100%",
    statLabel: "zero downtime",
    span: 1,
  },
  {
    title: "Preview URLs",
    description:
      "Every branch gets a unique live preview link automatically.",
    stat: "∞",
    statLabel: "preview envs",
    span: 1,
  },
  {
    title: "Build caching",
    description:
      "Incremental builds cached intelligently. Subsequent deploys are dramatically faster.",
    stat: "10×",
    statLabel: "faster rebuilds",
    span: 1,
  },
  {
    title: "Custom domains + SSL",
    description:
      "Bring your own domain. Certificates are provisioned and auto-renewed at no cost.",
    stat: "Auto",
    statLabel: "SSL / HTTPS",
    span: 1,
  },
  {
    title: "Deploy hooks",
    description:
      "Trigger builds via webhook from any service — CMS, CI, or cron.",
    stat: "REST",
    statLabel: "webhook API",
    span: 2,
  },
];

export default function Features() {
  const sectionRef = useRef<HTMLElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (headRef.current) {
        gsap.fromTo(
          headRef.current,
          { y: 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: headRef.current,
              start: "top 82%",
              once: true,
            },
          }
        );
      }

      const cards = gridRef.current?.querySelectorAll(".feature-card");
      if (cards && cards.length > 0) {
        gsap.fromTo(
          cards,
          { y: 28, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.08,
            ease: "power2.out",
            scrollTrigger: {
              trigger: gridRef.current,
              start: "top 80%",
              once: true,
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative py-28 sm:py-32"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[31.25rem] w-[56.25rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(ellipse, rgba(200,255,60,0.03) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        <div ref={headRef} className="mx-auto mb-20 max-w-2xl text-center">
          <span className="mb-3 block font-mono text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-ash">
            Capabilities
          </span>

          <h2 className="font-serif text-[clamp(2.4rem,5vw,4.8rem)] font-normal leading-[0.95] tracking-[-0.05em] text-bone">
            Everything ships need.
            <br />
            <em className="text-phosphor" style={{ fontStyle: "italic" }}>
              Nothing they don't.
            </em>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-ash sm:text-base">
            Built to be fast by default, reliable by design, and invisible in practice.
          </p>
        </div>

        <div ref={gridRef} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className={`feature-card group relative overflow-hidden rounded-2xl border border-[rgba(232,230,225,0.08)] bg-slate p-8 transition-all duration-300 hover:-translate-y-0.5 hover:border-[rgba(232,230,225,0.14)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.3)] before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-[radial-gradient(ellipse_at_50%_120%,rgba(200,255,60,0.04)_0%,transparent_60%)] before:content-[''] before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100 ${
                f.span === 2 ? "xl:col-span-2" : ""
              }`}
            >
              <div className="relative z-10 mb-5 flex items-baseline gap-2.5">
                <span
                  className={`font-serif tracking-[-0.03em] text-phosphor ${
                    f.span === 2 ? "text-[3.25rem]" : "text-[2.5rem]"
                  }`}
                >
                  {f.stat}
                </span>
                <span className="font-mono text-[0.6875rem] tracking-[0.06em] text-ash">
                  {f.statLabel}
                </span>
              </div>

              <h3 className="relative z-10 mb-2 font-sans text-[1.0625rem] font-semibold tracking-[-0.01em] text-bone">
                {f.title}
              </h3>

              <p className="relative z-10 text-sm leading-[1.7] text-ash">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}