import React, { useState, useEffect } from 'react';
import { Menu, X, User, Shield, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';
import { SettingsModal } from './SettingsModal';

export const Navbar: React.FC = () => {
  const { user, isSupabaseConfigured } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled(isScrolled);

      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Scroll Progress Bar at Right Edge */}
      <div className="fixed top-0 right-0 bottom-0 w-1 z-50 bg-[#121212]/5 pointer-events-none">
        <div
          className="w-full bg-[#121212] transition-all duration-150"
          style={{ height: `${scrollProgress}%` }}
        />
      </div>

      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-[#F7F5F2]/95 backdrop-blur-md border-b border-[#121212]/10 py-3 shadow-sm'
            : 'bg-[#F7F5F2] border-b border-[#121212]/10 py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <a
            href="#"
            className="flex items-center gap-3.5 group text-left focus:outline-none"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div className="w-8 h-8 bg-[#121212] flex items-center justify-center text-[#F7F5F2] font-bold text-xs tracking-wider">
              S.AI
            </div>
            <div>
              <span className="text-xl font-serif font-bold tracking-tight text-[#121212]">
                Schrodinger<span className="italic font-normal">Ai</span>
              </span>
              <span className="block text-[9px] uppercase tracking-[0.2em] font-bold text-[#121212]/60 font-mono">
                Studio Suite v3.2
              </span>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-[11px] uppercase tracking-[0.18em] font-bold text-[#121212]">
            <button
              onClick={() => scrollToSection('tools')}
              className="hover:opacity-60 transition-opacity border-b-2 border-transparent hover:border-[#121212] pb-0.5 cursor-pointer"
            >
              Tools
            </button>
            <button
              onClick={() => scrollToSection('content-creator')}
              className="hover:opacity-60 transition-opacity border-b-2 border-transparent hover:border-[#121212] pb-0.5 cursor-pointer"
            >
              Content Agent
            </button>
            <button
              onClick={() => scrollToSection('automation')}
              className="hover:opacity-60 transition-opacity border-b-2 border-transparent hover:border-[#121212] pb-0.5 cursor-pointer"
            >
              n8n Pipeline
            </button>
            <button
              onClick={() => scrollToSection('why-ai')}
              className="hover:opacity-60 transition-opacity border-b-2 border-transparent hover:border-[#121212] pb-0.5 cursor-pointer"
            >
              Why AI
            </button>
          </nav>

          {/* User Auth & Settings Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSettingsModalOpen(true)}
              className="p-2 bg-white border border-[#121212]/20 hover:border-[#121212] text-[#121212] flex items-center justify-center cursor-pointer transition-colors"
              title="AI & Cloudflare Settings"
            >
              <Settings className="w-4 h-4 text-[#121212]" />
            </button>

            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-3 py-2 bg-white border border-[#121212]/20 hover:border-[#121212] text-[10px] font-mono uppercase tracking-widest font-bold text-[#121212] flex items-center gap-2 cursor-pointer transition-colors"
            >
              <User className="w-3.5 h-3.5 text-[#121212]" />
              <span className="hidden sm:inline">
                {user && user.provider !== 'guest' ? (user.name || user.email) : 'Account / Login'}
              </span>
              <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </button>

            <button
              onClick={() => scrollToSection('tools')}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-[#121212] text-[#F7F5F2] text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#262626] transition-colors shadow-sm cursor-pointer"
            >
              <span>Launch Studio</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#121212] border border-[#121212]/20 hover:border-[#121212] focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-[#F7F5F2] border-b border-[#121212]/10 px-6 pt-4 pb-6 mt-3 space-y-3"
            >
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSettingsModalOpen(true);
                }}
                className="w-full text-left py-2.5 text-xs font-bold uppercase tracking-widest text-[#121212] border-b border-[#121212]/10 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span>AI & Cloudflare Settings</span>
                </div>
                <span className="text-[10px] font-mono text-[#121212]/50">KEYS</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAuthModalOpen(true);
                }}
                className="w-full text-left py-2.5 text-xs font-bold uppercase tracking-widest text-[#121212] border-b border-[#121212]/10 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>{user && user.provider !== 'guest' ? `Profile: ${user.name}` : 'Login / Auth'}</span>
                </div>
                <span className="text-[10px] font-mono text-[#121212]/50">SUPABASE</span>
              </button>
              <button
                onClick={() => scrollToSection('tools')}
                className="w-full text-left py-2.5 text-xs font-bold uppercase tracking-widest text-[#121212] border-b border-[#121212]/10 flex items-center justify-between"
              >
                <span>Tools Studio</span>
              </button>
              <button
                onClick={() => scrollToSection('content-creator')}
                className="w-full text-left py-2.5 text-xs font-bold uppercase tracking-widest text-[#121212] border-b border-[#121212]/10 flex items-center justify-between"
              >
                <span>Content Creator Agent</span>
              </button>
              <button
                onClick={() => scrollToSection('automation')}
                className="w-full text-left py-2.5 text-xs font-bold uppercase tracking-widest text-[#121212] border-b border-[#121212]/10 flex items-center justify-between"
              >
                <span>n8n Workflows</span>
              </button>
              <button
                onClick={() => scrollToSection('why-ai')}
                className="w-full text-left py-2.5 text-xs font-bold uppercase tracking-widest text-[#121212] border-b border-[#121212]/10 flex items-center justify-between"
              >
                <span>Why AI</span>
              </button>
              <button
                onClick={() => scrollToSection('tools')}
                className="w-full mt-3 py-3 bg-[#121212] text-[#F7F5F2] text-[10px] uppercase tracking-[0.2em] font-bold text-center"
              >
                Launch Studio Now
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Auth & Settings Modals */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <SettingsModal isOpen={settingsModalOpen} onClose={() => setSettingsModalOpen(false)} />
    </>
  );
};

