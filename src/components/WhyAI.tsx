import React from 'react';
import { Clock, TrendingUp, ShieldCheck, Brain } from 'lucide-react';

export const WhyAI: React.FC = () => {
  const benefits = [
    {
      icon: Clock,
      title: 'Saves 20+ Hours Every Week',
      description: 'Automate tedious video extraction, speech synthesis, weather updates, and routine scheduling in seconds.'
    },
    {
      icon: TrendingUp,
      title: 'Consistent High-Volume Output',
      description: 'Keep your social channels updated continuously without burnout or creative friction.'
    },
    {
      icon: ShieldCheck,
      title: 'Scales With Your Growth',
      description: 'Built on modular micro-architecture and n8n pipelines capable of handling enterprise workloads.'
    },
    {
      icon: Brain,
      title: 'Data-Driven Smart Strategy',
      description: 'Leverage server-side Gemini intelligence to structure content calendars and high-converting hooks.'
    }
  ];

  return (
    <section id="why-ai" className="py-20 bg-[#F7F5F2] border-t border-[#121212]/15 relative text-[#121212]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Title */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-xs font-mono uppercase tracking-[0.2em] font-bold text-[#121212]/60">
            [ 05 / THE CREATOR ADVANTAGE ]
          </span>
          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-[#121212]">
            Why Automate With SchrodingerAi
          </h2>
          <p className="text-[#121212]/70 text-base font-serif italic">
            Engineered to remove manual friction so you can focus on high-impact strategy and brand growth.
          </p>
        </div>

        {/* 4-Tile Benefit Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div
                key={idx}
                className="bg-white p-6 border border-[#121212]/15 hover:border-[#121212] transition-colors space-y-4 text-left shadow-xs"
              >
                <div className="w-12 h-12 bg-[#121212] text-[#F7F5F2] flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-serif font-bold text-[#121212]">
                  {b.title}
                </h3>
                <p className="text-xs text-[#121212]/70 leading-relaxed font-serif">
                  {b.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
