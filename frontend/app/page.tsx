'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HeroSection } from '@/components/landing/hero-section';
import { CommandCenter } from '@/components/landing/command-center';
import { AgentCapabilities } from '@/components/landing/agent-capabilities';
import { InteractiveDemo } from '@/components/landing/interactive-demo';
import { TrustSignals } from '@/components/landing/trust-signals';
import { WaitlistFooter } from '@/components/landing/waitlist-footer';

export default function Home() {
  const router = useRouter();

  const handleTryDemo = () => {
    // Scroll to command center and auto-start simulation
    const commandCenter = document.getElementById('command-center');
    if (commandCenter) {
      commandCenter.scrollIntoView({ behavior: 'smooth' });
      // Trigger simulation start after scroll
      setTimeout(() => {
        const playButton = document.getElementById('simulator-play-button');
        if (playButton) {
          playButton.click();
        }
      }, 800);
    }
  };

  const handleShowAgents = () => {
    // Scroll to interactive demo section
    const demoSection = document.getElementById('interactive-demo');
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <main className="min-h-screen bg-slate-950">
      <HeroSection onTryDemo={handleTryDemo} onShowAgents={handleShowAgents} />
      <div id="command-center">
        <CommandCenter />
      </div>
      <AgentCapabilities />
      <div id="interactive-demo">
        <InteractiveDemo />
      </div>
      <TrustSignals />
      <WaitlistFooter />
    </main>
  );
}
