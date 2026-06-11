import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    sub: "No card needed, ever",
    features: [
      "3 projects",
      "100 deploys / month",
      "1 GB storage",
      "shipwebsite.tech subdomain",
      "Community support",
    ],
    cta: "Start for free",
    featured: false,
  },
  {
    name: "Pro",
    price: "$12",
    pricePer: "/mo",
    sub: "Everything to ship seriously",
    features: [
      "Unlimited projects",
      "Unlimited deploys",
      "50 GB storage",
      "Custom domains + SSL",
      "Preview environments",
      "Build caching",
      "Priority support",
    ],
    cta: "Start Pro trial",
    featured: true,
  },
  {
    name: "Team",
    price: "$49",
    pricePer: "/mo",
    sub: "For teams shipping together",
    features: [
      "Everything in Pro",
      "Up to 10 members",
      "250 GB storage",
      "Role-based access",
      "Audit logs",
      "SLA guarantee",
      "Dedicated support",
    ],
    cta: "Contact us",
    featured: false,
  },
];

export default function Pricing() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Keep it stable first; add animation back only after the layout is confirmed.
    const ctx = gsap.context(() => {}, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="pricing"
      className="relative py-28 sm:py-32 bg-[#08090E]"
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        <div className="mx-auto mb-20 max-w-2xl text-center">
          <span className="mb-3 block font-mono text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-[#6B7084]">
            Pricing
          </span>
          <h2 className="text-balance font-serif text-[clamp(2.4rem,5vw,4.8rem)] font-normal leading-[0.95] tracking-[-0.05em] text-[#E8E6E1]">
            Simple pricing.
            <br />
            <em style={{ fontStyle: "italic", color: "#C8FF3C" }}>Serious capability.</em>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#6B7084] sm:text-base">
            Start free, upgrade when you need to. No hidden costs, no surprises.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {PLANS.map((p, i) => (
            <div
              key={i}
              className={`relative flex h-full flex-col gap-7 rounded-2xl border p-8 transition-all duration-300 ${
                p.featured
                  ? "border-[rgba(200,255,60,0.22)] bg-[linear-gradient(135deg,rgba(200,255,60,0.06)_0%,#1A1C25_100%)] shadow-[0_20px_60px_rgba(200,255,60,0.08)] md:-translate-y-3"
                  : "border-[rgba(232,230,225,0.08)] bg-[#1A1C25] hover:border-[rgba(232,230,225,0.12)]"
              }`}
            >
              {p.featured && (
                <div className="absolute left-1/2 top-0 -translate-x-1/2 rounded-b-lg bg-[#C8FF3C] px-4 py-1 font-mono text-[0.6875rem] font-semibold tracking-[0.06em] text-[#08090E]">
                  Most popular
                </div>
              )}

              <div className="pt-2">
                <span className="mb-3 block font-mono text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-[#6B7084]">
                  {p.name}
                </span>
                <div className="mb-2 flex items-baseline gap-1">
                  <span className="font-serif text-[3rem] tracking-[-0.03em] text-[#E8E6E1]">
                    {p.price}
                  </span>
                  {p.pricePer && <span className="text-sm text-[#6B7084]">{p.pricePer}</span>}
                </div>
                <p className="text-sm leading-6 text-[#6B7084]">{p.sub}</p>
              </div>

              <ul className="flex flex-1 flex-col gap-3">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2.5 text-sm text-[#6B7084]">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      className="shrink-0"
                      aria-hidden="true"
                    >
                      <path
                        d="M2 7l3.5 3.5L12 3"
                        stroke="#C8FF3C"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href="#"
                className={`mt-auto block rounded-xl border px-6 py-3.5 text-center font-sans text-sm font-semibold tracking-[-0.01em] transition-all duration-200 ${
                  p.featured
                    ? "border-[#C8FF3C] bg-[#C8FF3C] text-[#08090E] hover:shadow-[0_8px_32px_rgba(200,255,60,0.25)]"
                    : "border-[rgba(232,230,225,0.08)] bg-[rgba(255,255,255,0.03)] text-[#B7B4AB] hover:border-[rgba(200,255,60,0.2)] hover:text-[#E8E6E1]"
                }`}
              >
                {p.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}