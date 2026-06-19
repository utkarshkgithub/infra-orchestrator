import Navbar from '../landingPage/components/Navbar';
import Hero from '../landingPage/components/Hero';
import LogoStrip from '../landingPage/components/LogoStrip';
import HowItWorks from '../landingPage/components/HowItWorks';
import Features from '../landingPage/components/Features';
import Terminal from '../landingPage/components/Terminal';
import Pricing from '../landingPage/components/Pricing';
import Footer from '../landingPage/components/Footer';
import SoftAurora from '../landingPage/components/softaurora';

const NOISE_TEXTURE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`;

export default function LandingPage() {
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
          backgroundRepeat: 'repeat',
        }}
      />

      <div className="relative isolate z-10 min-h-screen overflow-x-hidden">
        <Navbar />
        <main>
          <Hero />
          <LogoStrip />
          <HowItWorks />
          <Features />
          <Terminal />
          <Pricing />
          <Footer />
        </main>
      </div>
    </div>
  );
}
