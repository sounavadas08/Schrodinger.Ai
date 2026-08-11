import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Marquee } from './components/Marquee';
import { ToolsGallery } from './components/ToolsGallery';
import { ContentCreatorAgent } from './components/ContentCreatorAgent';
import { AutomationSection } from './components/AutomationSection';
import { WhyAI } from './components/WhyAI';
import { CTABand } from './components/CTABand';
import { Footer } from './components/Footer';

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#F7F5F2] text-[#121212] selection:bg-[#121212] selection:text-[#F7F5F2] font-sans">
        <Navbar />
        <main>
          <Hero />
          <Marquee />
          <ToolsGallery />
          <ContentCreatorAgent />
          <AutomationSection />
          <WhyAI />
          <CTABand />
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}
