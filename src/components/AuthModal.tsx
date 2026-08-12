import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Shield, Github, LogOut, Database } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    user,
    isSupabaseConfigured,
    signInWithOAuth,
    signInAsGuest,
    signOut
  } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOAuth = async (provider: 'github') => {
    setLoading(true);
    setError(null);
    const res = await signInWithOAuth(provider);
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || `Failed to sign in with ${provider}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#121212]/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative max-w-md w-full bg-white dark:bg-[#191919] border border-[#121212] dark:border-[#F7F5F2]/10 p-6 text-[#121212] dark:text-[#F7F5F2] shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#121212]/15 dark:border-[#F7F5F2]/10 pb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#121212] dark:text-[#F7F5F2]" />
            <h3 className="text-xl font-serif font-bold tracking-tight">
              {user && user.provider !== 'guest' ? 'Account Portal' : 'Studio Authentication'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 bg-[#121212] dark:bg-[#F7F5F2] text-[#F7F5F2] dark:text-[#121212] hover:bg-[#262626] dark:hover:bg-[#EFECE6] cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Supabase Status Indicator */}
        <div className="p-3 bg-[#F7F5F2] dark:bg-[#121212] border border-[#121212]/15 dark:border-[#F7F5F2]/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono">
            <Database className="w-4 h-4 text-[#121212]/70 dark:text-[#F7F5F2]/70" />
            <span className="font-bold">Database Engine:</span>
          </div>
          <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 border ${
            isSupabaseConfigured
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-600/30 text-emerald-800 dark:text-emerald-400'
              : 'bg-amber-50 dark:bg-amber-950/20 border-amber-600/30 text-amber-900 dark:text-amber-400'
          }`}>
            {isSupabaseConfigured ? '● Supabase Active' : '○ Local Supabase Auth'}
          </span>
        </div>

        {/* If user is already logged in */}
        {user && user.provider !== 'guest' ? (
          <div className="space-y-5 text-left">
            <div className="p-4 bg-[#F7F5F2] dark:bg-[#121212] border border-[#121212]/15 dark:border-[#F7F5F2]/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#121212]/60 dark:text-[#F7F5F2]/60">Active Session</span>
                <span className="text-[10px] font-mono uppercase font-bold text-[#121212] dark:text-[#F7F5F2] bg-white dark:bg-[#191919] border border-[#121212]/20 dark:border-[#F7F5F2]/20 px-2 py-0.5">
                  {user.provider}
                </span>
              </div>
              <p className="text-base font-serif font-bold text-[#121212] dark:text-[#F7F5F2]">{user.name || 'Creator User'}</p>
              <p className="text-xs text-[#121212]/70 dark:text-[#F7F5F2]/70 font-mono">{user.email}</p>
            </div>

            <div className="p-3 bg-white dark:bg-[#121212] border border-[#121212]/15 dark:border-[#F7F5F2]/10 text-xs text-[#121212]/80 dark:text-[#F7F5F2]/80 font-serif italic">
              Your prompt history, favorite visuals, and custom settings are linked to this profile.
            </div>

            <button
              onClick={() => {
                signOut();
                onClose();
              }}
              className="w-full py-3 bg-[#121212] dark:bg-[#F7F5F2] hover:bg-red-700 dark:hover:bg-red-800 text-[#F7F5F2] dark:text-[#121212] font-bold text-xs uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out Account</span>
            </button>
          </div>
        ) : (
          <div className="space-y-5 text-left">
            <p className="text-xs text-[#121212]/70 dark:text-[#F7F5F2]/70 font-serif italic text-center">
              Authenticate via GitHub to access your workspace, customize AI engine settings, and sync credentials.
            </p>

            {/* OAuth Quick Buttons */}
            <div>
              <button
                onClick={() => handleOAuth('github')}
                disabled={loading}
                className="w-full py-3.5 px-4 bg-white dark:bg-[#121212] border border-[#121212]/20 dark:border-[#F7F5F2]/20 hover:border-[#121212] dark:hover:border-[#F7F5F2] text-xs font-bold text-[#121212] dark:text-[#F7F5F2] flex items-center justify-center gap-3.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Github className="w-5 h-5" />
                <span className="uppercase tracking-[0.1em]">{loading ? 'Redirecting...' : 'Sign in with GitHub'}</span>
              </button>
            </div>

            {error && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-800 dark:text-red-400 text-xs font-serif italic">
                {error}
              </div>
            )}

            <div className="pt-4 border-t border-[#121212]/10 dark:border-[#F7F5F2]/10 flex items-center justify-between">
              <button
                onClick={() => {
                  signInAsGuest();
                  onClose();
                }}
                className="text-xs text-[#121212]/60 dark:text-[#F7F5F2]/60 hover:text-[#121212] dark:hover:text-[#F7F5F2] font-mono underline cursor-pointer"
              >
                Continue as Guest
              </button>
              <span className="text-[10px] font-mono text-[#121212]/40 dark:text-[#F7F5F2]/40 uppercase font-bold tracking-wider">GitHub OAuth Only</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
