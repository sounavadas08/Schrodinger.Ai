import React, { useState, useEffect } from 'react';
import { X, Settings, Cpu, Key, Check, Server, ShieldCheck } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [provider, setProvider] = useState<'auto' | 'cloudflare' | 'gemini'>('auto');
  const [cfAccountId, setCfAccountId] = useState('');
  const [cfApiToken, setCfApiToken] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setProvider((localStorage.getItem('ai_provider') as any) || 'auto');
      setCfAccountId(localStorage.getItem('cf_account_id') || '');
      setCfApiToken(localStorage.getItem('cf_api_token') || '');
      setGeminiApiKey(localStorage.getItem('gemini_api_key') || '');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('ai_provider', provider);
    localStorage.setItem('cf_account_id', cfAccountId.trim());
    localStorage.setItem('cf_api_token', cfApiToken.trim());
    localStorage.setItem('gemini_api_key', geminiApiKey.trim());

    // Synchronize settings with database if logged in
    if (isSupabaseConfigured && supabase && user && user.provider !== 'guest') {
      try {
        await supabase.from('user_settings').upsert({
          user_id: user.id,
          ai_provider: provider,
          cf_account_id: cfAccountId.trim(),
          cf_api_token: cfApiToken.trim(),
          gemini_api_key: geminiApiKey.trim(),
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.error('Failed to sync settings to Supabase:', err);
      }
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#121212]/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative max-w-lg w-full bg-white border border-[#121212] p-6 text-[#121212] shadow-2xl space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#121212]/15 pb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#121212]" />
            <h3 className="text-xl font-serif font-bold tracking-tight">API & AI Provider Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 bg-[#121212] text-[#F7F5F2] hover:bg-[#262626] cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5 text-left">
          {/* Provider Selector */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#121212] flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              <span>Primary AI Engine Provider</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setProvider('auto')}
                className={`py-2 px-3 border text-xs font-mono font-bold uppercase tracking-wider cursor-pointer transition-all ${
                  provider === 'auto'
                    ? 'bg-[#121212] text-white border-[#121212]'
                    : 'bg-white text-[#121212] border-[#121212]/20 hover:border-[#121212]'
                }`}
              >
                Auto / Dual
              </button>
              <button
                type="button"
                onClick={() => setProvider('cloudflare')}
                className={`py-2 px-3 border text-xs font-mono font-bold uppercase tracking-wider cursor-pointer transition-all ${
                  provider === 'cloudflare'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-[#121212] border-[#121212]/20 hover:border-[#121212]'
                }`}
              >
                Cloudflare
              </button>
              <button
                type="button"
                onClick={() => setProvider('gemini')}
                className={`py-2 px-3 border text-xs font-mono font-bold uppercase tracking-wider cursor-pointer transition-all ${
                  provider === 'gemini'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-[#121212] border-[#121212]/20 hover:border-[#121212]'
                }`}
              >
                Gemini
              </button>
            </div>
            <p className="text-[11px] text-[#121212]/60 font-sans">
              Choose Cloudflare Workers AI, Google Gemini, or Auto-Fallback mode.
            </p>
          </div>

          {/* Cloudflare Account ID & API Token */}
          <div className="space-y-3 p-4 bg-[#F7F5F2] border border-[#121212]/15">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5" /> Cloudflare Workers AI
              </span>
              <span className="text-[10px] font-mono text-[#121212]/50">Llama 3.1 & SDXL</span>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase font-bold text-[#121212]/70 mb-1">
                Account ID
              </label>
              <input
                type="text"
                value={cfAccountId}
                onChange={(e) => setCfAccountId(e.target.value)}
                placeholder="e.g. 5f4d8... (from Cloudflare Dashboard)"
                className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-[#121212]/20 focus:border-[#121212] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase font-bold text-[#121212]/70 mb-1">
                API Token
              </label>
              <input
                type="password"
                value={cfApiToken}
                onChange={(e) => setCfApiToken(e.target.value)}
                placeholder="Workers AI Token (with Workers AI Read permissions)"
                className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-[#121212]/20 focus:border-[#121212] focus:outline-none"
              />
            </div>
          </div>

          {/* Gemini API Key */}
          <div className="space-y-3 p-4 bg-[#F7F5F2] border border-[#121212]/15">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" /> Google Gemini API Key
              </span>
              <span className="text-[10px] font-mono text-[#121212]/50">Gemini 3.6 & 3.1</span>
            </div>

            <div>
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="AIzaSy... (Gemini API Key)"
                className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-[#121212]/20 focus:border-[#121212] focus:outline-none"
              />
            </div>
          </div>

          {/* Success / Save Action */}
          <div className="pt-2 flex items-center justify-between">
            {savedSuccess ? (
              <div className="text-xs font-mono font-bold text-emerald-600 flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Settings Saved!
              </div>
            ) : (
              <span className="text-[10px] font-mono text-[#121212]/50 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Credentials stored safely in browser
              </span>
            )}

            <button
              type="submit"
              className="px-5 py-2.5 bg-[#121212] text-[#F7F5F2] text-xs font-mono font-bold uppercase tracking-wider hover:bg-[#262626] transition-colors cursor-pointer"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
