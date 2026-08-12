import React from 'react';
import { Globe, Instagram, Heart, Shield, FileText } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#121212] border-t border-[#121212] pt-16 pb-12 text-[#F7F5F2]/70 text-xs relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-2 text-left">
            <div className="flex items-center gap-2.5">
              <span className="text-xl font-serif font-bold text-[#F7F5F2] tracking-tight">
                Schrodinger<span className="italic font-normal">Ai</span>
              </span>
            </div>
            <p className="text-[#F7F5F2]/60 text-xs max-w-sm leading-relaxed font-serif italic">
              The ultimate AI studio suite for content creators, agencies, and automation engineers. Build, generate, and grow without the grind.
            </p>
          </div>

          {/* External Links */}
          <div className="space-y-3 text-left">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#F7F5F2]">Official Links</h4>
            <ul className="space-y-2 font-serif">
              <li>
                <a
                  href="https://myscalper.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#F7F5F2] transition-colors inline-flex items-center gap-2"
                >
                  <Globe className="w-3.5 h-3.5 text-[#F7F5F2]/70" />
                  <span>myscalper.in</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/myscalper.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#F7F5F2] transition-colors inline-flex items-center gap-2"
                >
                  <Instagram className="w-3.5 h-3.5 text-[#F7F5F2]/70" />
                  <span>Instagram @myscalper.in</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Quick Nav */}
          <div className="space-y-3 text-left">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#F7F5F2]">Studio Navigation</h4>
            <ul className="space-y-2 font-serif">
              <li>
                <a href="#tools" className="hover:text-[#F7F5F2] transition-colors">
                  Studio Tools
                </a>
              </li>
              <li>
                <a href="#content-creator" className="hover:text-[#F7F5F2] transition-colors">
                  Content Creator Agent
                </a>
              </li>
              <li>
                <a href="#automation" className="hover:text-[#F7F5F2] transition-colors">
                  n8n Workflows
                </a>
              </li>
              <li>
                <a href="#why-ai" className="hover:text-[#F7F5F2] transition-colors">
                  Why AI
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 border-t border-[#F7F5F2]/10">
          <a
            href="/privacy.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#F7F5F2]/5 border border-[#F7F5F2]/15 hover:bg-[#F7F5F2]/10 hover:border-[#F7F5F2]/30 transition-all text-[#F7F5F2]/80 hover:text-[#F7F5F2] font-mono text-[11px] uppercase tracking-wider"
          >
            <Shield className="w-3.5 h-3.5" />
            Privacy Policy
          </a>
          <a
            href="/terms.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#F7F5F2]/5 border border-[#F7F5F2]/15 hover:bg-[#F7F5F2]/10 hover:border-[#F7F5F2]/30 transition-all text-[#F7F5F2]/80 hover:text-[#F7F5F2] font-mono text-[11px] uppercase tracking-wider"
          >
            <FileText className="w-3.5 h-3.5" />
            Terms of Service
          </a>
        </div>

        {/* Bottom Bar & Credit Line */}
        <div className="pt-8 border-t border-[#F7F5F2]/15 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
          <p className="text-[10px] text-[#F7F5F2]/50">© 2026 SchrodingerAi. All rights reserved.</p>

          <div className="flex items-center gap-2 px-4 py-2 bg-[#F7F5F2]/10 border border-[#F7F5F2]/15 text-[#F7F5F2]">
            <span className="text-[10px] uppercase tracking-wider font-bold">Crafted by</span>
            <span className="font-bold text-xs">Sounava Das & Sufal Paul</span>
            <Heart className="w-3.5 h-3.5 text-red-400 fill-current" />
          </div>
        </div>
      </div>
    </footer>
  );
};
