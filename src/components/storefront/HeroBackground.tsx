"use client";

import React from "react";

export function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      
      {/* 1. Deep Navy Base & Ambient Shift Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0b1329] via-[#091124] to-slate-950 animate-hero-gradient opacity-95" />

      {/* 2. Soft Healthcare Ambient Grid (Restrained 4-5% Opacity with Center-Fade Mask) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#38bdf8_1px,transparent_1px),linear-gradient(to_bottom,#38bdf8_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_75%_55%_at_50%_40%,#000_50%,transparent_100%)] opacity-[0.045]" />

      {/* 3. Soft Ambient Blurred Lighting Gradients (Cinematic 20-36s Multi-layer Glow) */}
      
      {/* Layer 1: Royal Blue Ambient Glow (Top-Left / Header Area) */}
      <div className="absolute -top-32 -left-28 sm:-top-44 sm:-left-36 w-[380px] sm:w-[680px] h-[380px] sm:h-[680px] rounded-full bg-blue-600/14 blur-[100px] sm:blur-[160px] animate-orb-1" />

      {/* Layer 2: Soft Sky / Cyan Ambient Light (Right / Behind Hero Photographic Composition) */}
      <div className="absolute top-8 -right-24 sm:top-12 sm:-right-32 w-[340px] sm:w-[620px] h-[340px] sm:h-[620px] rounded-full bg-sky-500/12 blur-[90px] sm:blur-[150px] animate-orb-2" />

      {/* Layer 3: Deep Indigo Support Light (Bottom-Center) */}
      <div className="absolute -bottom-36 left-1/3 w-[300px] sm:w-[520px] h-[300px] sm:h-[520px] rounded-full bg-indigo-600/10 blur-[90px] sm:blur-[140px] animate-orb-3" />

      {/* Layer 4: Subtle Soft Cyan Accent (Mid-Right Ambient Float) */}
      <div className="hidden sm:block absolute top-1/3 right-1/4 w-[240px] sm:w-[400px] h-[240px] sm:h-[400px] rounded-full bg-teal-400/8 blur-[80px] sm:blur-[120px] animate-orb-4" />

      {/* 4. Ambient Restrained Depth Ring (Far Right / Depth Only, 4-6% Opacity) */}
      <div className="hidden lg:block absolute -top-16 -right-20 w-[600px] h-[600px] rounded-full border border-sky-400/5 animate-pulse-ring" />

      {/* 5. Ambient Micro-Particles (Exactly 6 Micro-Specks with Restrained Opacity) */}
      <div className="absolute top-[28%] left-[18%] w-1 h-1 rounded-full bg-blue-200/20 blur-[0.5px] animate-particle-1" />
      <div className="absolute top-[62%] left-[32%] w-1 h-1 rounded-full bg-sky-200/25 blur-[0.5px] animate-particle-2" />
      <div className="absolute top-[22%] left-[54%] w-1.5 h-1.5 rounded-full bg-blue-300/18 blur-[0.5px] animate-particle-3" />
      <div className="absolute top-[72%] left-[68%] w-1 h-1 rounded-full bg-indigo-200/20 blur-[0.5px] animate-particle-1" />
      <div className="hidden sm:block absolute top-[40%] left-[84%] w-1 h-1 rounded-full bg-sky-200/20 blur-[0.5px] animate-particle-2" />
      <div className="hidden sm:block absolute top-[80%] left-[22%] w-1 h-1 rounded-full bg-teal-200/18 blur-[0.5px] animate-particle-3" />

      {/* 6. Seamless Section Transition Gradient to Category Section */}
      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

    </div>
  );
}
