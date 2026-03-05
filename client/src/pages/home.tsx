import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { AnatomySection } from "@/components/anatomy-section";
import { StatsSection } from "@/components/stats-section";
import { HabitatSection } from "@/components/habitat-section";
import { ShellStrengthSection } from "@/components/shell-strength-section";
import { ImpactTester } from "@/components/impact-tester";
import { StressWaveVisualizer } from "@/components/stress-wave-visualizer";
import { CavitationLifecycle } from "@/components/cavitation-lifecycle";
import { HelicoidalStack3D } from "@/components/helicoidal-stack-3d";
import { CrackFrontVisualizer } from "@/components/crack-front-visualizer";
import { MicroscopicVisualizer } from "@/components/microscopic-visualizer";
import { CustomProjectileLab } from "@/components/custom-projectile-lab";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <AnatomySection />
        <ImpactTester />
        <CustomProjectileLab />
        <ShellStrengthSection />
        <StressWaveVisualizer />
        <CavitationLifecycle />
        <HelicoidalStack3D />
        <CrackFrontVisualizer />
        <MicroscopicVisualizer />
        <StatsSection />
        <HabitatSection />
      </main>
      
      <footer className="py-8 border-t border-white/10 bg-black/40 text-center">
        <p className="text-xs text-muted-foreground font-display tracking-widest">
          Designed for Stomatopod Enthusiasts © 2024
        </p>
      </footer>
    </div>
  );
}