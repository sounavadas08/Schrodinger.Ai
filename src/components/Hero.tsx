import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Play, Cpu, Gauge, Zap } from 'lucide-react';

export const Hero: React.FC = () => {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-[#F7F5F2] text-[#121212] border-b border-[#121212]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Eyebrow Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-3 px-3 py-1 bg-[#121212] text-[#F7F5F2] text-[10px] uppercase tracking-[0.25em] font-bold mb-8 shadow-sm"
        >
          <span>ARCHITECTURAL RELEASE v3.2</span>
          <span className="w-1.5 h-1.5 bg-[#F7F5F2] rounded-full"></span>
          <span>STUDIO SUITE</span>
        </motion.div>

        {/* Main Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-serif text-5xl sm:text-7xl md:text-8xl tracking-tight text-[#121212] max-w-5xl mx-auto leading-[0.92]"
        >
          Scale Your Creation<br />
          <span className="italic font-normal">Without the Grind.</span>
        </motion.h1>

        {/* Divider Line with Quote */}
        <div className="flex items-center justify-center gap-4 my-8">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="h-px bg-[#121212]/20 w-16 origin-right"
          />
          <motion.span
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-[10px] font-mono uppercase tracking-[0.18em] font-bold text-[#121212]/60 italic whitespace-nowrap"
          >
            "made by Gen-Z devs for the Gen-Z creators"
          </motion.span>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="h-px bg-[#121212]/20 w-16 origin-left"
          />
        </div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-lg text-[#121212]/80 max-w-2xl mx-auto font-serif italic leading-relaxed"
        >
          An all-in-one editorial engine designed to generate AI visuals, synthesize speech, extract media, schedule routines, and automate creator workflows.
        </motion.p>

        {/* Action CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={() => scrollToSection('tools')}
            className="w-full sm:w-auto px-8 py-4 bg-[#121212] text-[#F7F5F2] text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#262626] transition-colors flex items-center justify-center gap-3 cursor-pointer shadow-sm"
          >
            <span>Explore Studio Tools</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => scrollToSection('why-ai')}
            className="w-full sm:w-auto px-8 py-4 bg-transparent text-[#121212] border border-[#121212]/30 hover:border-[#121212] text-[10px] uppercase tracking-[0.2em] font-bold transition-colors flex items-center justify-center gap-3 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Architecture Overview</span>
          </button>
        </motion.div>

        {/* Editorial Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto"
        >
          <div className="bg-white p-6 border border-[#121212]/10 flex flex-col items-center justify-center text-center shadow-xs">
            <Gauge className="w-5 h-5 text-[#121212]/60 mb-2" />
            <span className="text-3xl font-serif font-bold text-[#121212]">10x</span>
            <span className="text-[10px] uppercase tracking-widest text-[#121212]/60 font-bold mt-1">Creation Speed</span>
          </div>

          <div className="bg-white p-6 border border-[#121212]/10 flex flex-col items-center justify-center text-center shadow-xs">
            <Cpu className="w-5 h-5 text-[#121212]/60 mb-2" />
            <span className="text-3xl font-serif font-bold text-[#121212]">5 Core</span>
            <span className="text-[10px] uppercase tracking-widest text-[#121212]/60 font-bold mt-1">Studio Tools</span>
          </div>

          <div className="bg-white p-6 border border-[#121212]/10 flex flex-col items-center justify-center text-center shadow-xs">
            <Zap className="w-5 h-5 text-[#121212]/60 mb-2" />
            <span className="text-3xl font-serif font-bold text-[#121212]">100%</span>
            <span className="text-[10px] uppercase tracking-widest text-[#121212]/60 font-bold mt-1">Autonomous Agent</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
