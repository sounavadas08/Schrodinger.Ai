import React from 'react';
import { ArrowRight, BookOpen } from 'lucide-react';

export const CTABand: React.FC = () => {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-20 bg-[#F7F5F2] border-t border-[#121212]/15 relative text-[#121212]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-white border border-[#121212]/20 p-10 sm:p-16 text-center shadow-xs">
          <div className="relative z-10 space-y-6 max-w-3xl mx-auto">
            <span className="text-xs font-mono uppercase tracking-[0.2em] font-bold text-[#121212]/60">
              [ 06 / GET STARTED ]
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif font-bold text-[#121212] leading-tight">
              Ready to Let AI Run Your Creator Busywork?
            </h2>

            <p className="text-[#121212]/70 text-base sm:text-lg max-w-xl mx-auto font-serif italic">
              Join thousands of creators using SchrodingerAi to generate visuals, extract media, and automate social workflows.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={() => scrollToSection('tools')}
                className="w-full sm:w-auto px-8 py-4 bg-[#121212] hover:bg-[#262626] text-[#F7F5F2] font-bold text-xs uppercase tracking-[0.2em] shadow-sm transition-colors flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Launch Studio Now</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => scrollToSection('why-ai')}
                className="w-full sm:w-auto px-8 py-4 bg-[#F7F5F2] hover:bg-[#121212]/10 border border-[#121212]/20 text-[#121212] font-bold text-xs uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-[#121212]" />
                <span>View Architecture</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
