import React, { useState, useEffect } from 'react';
import { Menu, X, User, Shield, Settings, Sun, Moon } from 'lucide-react';
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

  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

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
            ? 'bg-[#F7F5F2]/95 dark:bg-[#121212]/95 backdrop-blur-md border-b border-[#121212]/10 dark:border-[#F7F5F2]/10 py-3 shadow-sm'
            : 'bg-[#F7F5F2] dark:bg-[#121212] border-b border-[#121212]/10 dark:border-[#F7F5F2]/10 py-5'
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
            <div className="w-8 h-8 bg-white border border-[#121212]/15 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="Schrodinger AI Logo" className="w-full h-full object-cover scale-[1.3] translate-y-[-2%]" />
            </div>
            <div>
              <span className="text-xl font-serif font-bold tracking-tight text-[#121212] dark:text-[#F7F5F2]">
                Schrodinger<span className="italic font-normal">Ai</span>
              </span>
              <span className="block text-[9px] uppercase tracking-[0.2em] font-bold text-[#121212]/60 dark:text-[#F7F5F2]/60 font-mono">
                Studio Suite v3.2
              </span>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-[11px] uppercase tracking-[0.18em] font-bold text-[#121212] dark:text-[#F7F5F2]">
            <button
              onClick={() => scrollToSection('tools')}
              className="hover:opacity-60 transition-opacity border-b-2 border-transparent hover:border-[#121212] dark:hover:border-[#F7F5F2] pb-0.5 cursor-pointer"
            >
              Tools
            </button>
            <button
              onClick={() => scrollToSection('content-creator')}
              className="hover:opacity-60 transition-opacity border-b-2 border-transparent hover:border-[#121212] dark:hover:border-[#F7F5F2] pb-0.5 cursor-pointer"
            >
              Content Agent
            </button>
            <button
              onClick={() => scrollToSection('why-ai')}
              className="hover:opacity-60 transition-opacity border-b-2 border-transparent hover:border-[#121212] dark:hover:border-[#F7F5F2] pb-0.5 cursor-pointer"
            >
              Why AI
            </button>
          </nav>

          {/* User Auth & Settings Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSettingsModalOpen(true)}
              className="p-2 bg-white dark:bg-[#121212] border border-[#121212]/20 dark:border-[#F7F5F2]/20 hover:border-[#121212] dark:hover:border-[#F7F5F2] text-[#121212] dark:text-[#F7F5F2] flex items-center justify-center cursor-pointer transition-colors"
              title="AI & Cloudflare Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-3 py-2 bg-white dark:bg-[#121212] border border-[#121212]/20 dark:border-[#F7F5F2]/20 hover:border-[#121212] dark:hover:border-[#F7F5F2] text-[10px] font-mono uppercase tracking-widest font-bold text-[#121212] dark:text-[#F7F5F2] flex items-center gap-2 cursor-pointer transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {user && user.provider !== 'guest' ? (user.name || user.email) : 'Account / Login'}
              </span>
              <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </button>

            <button
              onClick={() => scrollToSection('tools')}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-[#121212] dark:bg-[#F7F5F2] text-[#F7F5F2] dark:text-[#121212] text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#262626] dark:hover:bg-[#EFECE6] transition-colors shadow-sm cursor-pointer border dark:border-transparent"
            >
              <span>Launch Studio</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#121212] dark:text-[#F7F5F2] bg-white dark:bg-[#121212] border border-[#121212]/20 dark:border-[#F7F5F2]/20 hover:border-[#121212] dark:hover:border-[#F7F5F2] focus:outline-none"
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
              className="md:hidden bg-[#F7F5F2] dark:bg-[#121212] border-b border-[#121212]/10 dark:border-[#F7F5F2]/10 px-6 pt-4 pb-6 mt-3 space-y-3"
            >
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSettingsModalOpen(true);
                }}
                className="w-full text-left py-2.5 text-xs font-bold uppercase tracking-widest text-[#121212] dark:text-[#F7F5F2] border-b border-[#121212]/10 dark:border-[#F7F5F2]/10 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span>AI & Cloudflare Settings</span>
                </div>
                <span className="text-[10px] font-mono text-[#121212]/50 dark:text-[#F7F5F2]/50">KEYS</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAuthModalOpen(true);
                }}
                className="w-full text-left py-2.5 text-xs font-bold uppercase tracking-widest text-[#121212] dark:text-[#F7F5F2] border-b border-[#121212]/10 dark:border-[#F7F5F2]/10 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>{user && user.provider !== 'guest' ? `Profile: ${user.name}` : 'Login / Auth'}</span>
                </div>
                <span className="text-[10px] font-mono text-[#121212]/50 dark:text-[#F7F5F2]/50">SUPABASE</span>
              </button>



              <button
                onClick={() => scrollToSection('tools')}
                className="w-full text-left py-2.5 text-xs font-bold uppercase tracking-widest text-[#121212] dark:text-[#F7F5F2] border-b border-[#121212]/10 dark:border-[#F7F5F2]/10 flex items-center justify-between"
              >
                <span>Tools Studio</span>
              </button>
              <button
                onClick={() => scrollToSection('content-creator')}
                className="w-full text-left py-2.5 text-xs font-bold uppercase tracking-widest text-[#121212] dark:text-[#F7F5F2] border-b border-[#121212]/10 dark:border-[#F7F5F2]/10 flex items-center justify-between"
              >
                <span>Content Creator Agent</span>
              </button>
              <button
                onClick={() => scrollToSection('why-ai')}
                className="w-full text-left py-2.5 text-xs font-bold uppercase tracking-widest text-[#121212] dark:text-[#F7F5F2] border-b border-[#121212]/10 dark:border-[#F7F5F2]/10 flex items-center justify-between"
              >
                <span>Why AI</span>
              </button>
              <button
                onClick={() => scrollToSection('tools')}
                className="w-full mt-3 py-3 bg-[#121212] dark:bg-[#F7F5F2] text-[#F7F5F2] dark:text-[#121212] text-[10px] uppercase tracking-[0.2em] font-bold text-center"
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

