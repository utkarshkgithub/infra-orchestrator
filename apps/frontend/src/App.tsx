import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import LogoStrip from "./components/LogoStrip";
import HowItWorks from "./components/HowItWorks";
import Features from "./components/Features";
import Terminal from "./components/Terminal";
import Pricing from "./components/Pricing";
import Footer from "./components/Footer";
import SoftAurora from "./components/softaurora";

const NOISE_TEXTURE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`;

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
    });

    const raf = (time: number) => {
      lenis.raf(time * 1000);
    };

    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    const refreshId = window.setTimeout(() => {
      ScrollTrigger.refresh();
    }, 200);

    return () => {
      window.clearTimeout(refreshId);
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#08090E] font-sans text-[#E8E6E1]">
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <SoftAurora
          speed={0.8}
          scale={1.3}
          brightness={0.8}
          color1="#f7c21c"
          color2="#EAB308"
          noiseFrequency={2.5}
          noiseAmplitude={2.5}
          bandHeight={0.5}
          bandSpread={0.6}
          octaveDecay={0.2}
          layerOffset={0}
          colorSpeed={0.8}
          enableMouseInteraction
          mouseInfluence={0.25}
        />
      </div>

      <div
        className="pointer-events-none fixed inset-0 z-[1] opacity-[0.025]"
        aria-hidden="true"
        style={{
          backgroundImage: NOISE_TEXTURE,
          backgroundRepeat: "repeat",
        }}
      />

      <main className="relative isolate z-10 min-h-screen overflow-x-hidden">
        <Navbar />
        <Hero />
        <LogoStrip />
        <HowItWorks />
        <Features />
        <Terminal />
        <Pricing />
        <Footer />
      </main>
    </div>
  );
}