import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { HelicoidalStack3D } from "@/components/helicoidal-stack-3d";
import { CrackFrontVisualizer } from "@/components/crack-front-visualizer";
import { HelicoidalSlabSim } from "@/components/helicoidal-slab-sim";
import { HelicoidalPitchCompare } from "@/components/helicoidal-pitch-compare";
import { HelicoidToggleSim } from "@/components/helicoid-toggle";


export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <HelicoidalStack3D />
        <CrackFrontVisualizer />
        <HelicoidalSlabSim />
        <HelicoidalPitchCompare />
        <HelicoidToggleSim />
      </main>
      
      <footer className="py-8 border-t border-white/10 bg-black/40 text-center">
        <p className="text-xs text-muted-foreground font-display tracking-widest">
          Designed for Stomatopod Enthusiasts © 2024
        </p>
      </footer>
    </div>
  );
}