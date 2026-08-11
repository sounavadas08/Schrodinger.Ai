import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Mail, Key, Shield, UserCheck, Sparkles, Check, ArrowRight, Github, Chrome, LogOut, Database } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    user,
    isSupabaseConfigured,
    signInWithEmail,
    signUpWithEmail,
    signInWithMagicLink,
    signInWithOAuth,
    signInAsGuest,
    signOut
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'magic'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'signin') {
        const res = await signInWithEmail(email, password);
        if (!res.success) {
          setError(res.error || 'Invalid authentication credentials.');
        } else {
          onClose();
        }
      } else if (mode === 'signup') {
        const res = await signUpWithEmail(email, password, name);
        if (!res.success) {
          setError(res.error || 'Registration failed.');
        } else {
          setMessage('Account registered successfully!');
          setTimeout(() => onClose(), 1200);
        }
      } else if (mode === 'magic') {
        const res = await signInWithMagicLink(email);
        if (!res.success) {
          setError(res.error || 'Magic link request failed.');
        } else {
          setMessage(res.message || 'Magic link sent to your email.');
          setTimeout(() => onClose(), 2000);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
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
      <div className="relative max-w-md w-full bg-white border border-[#121212] p-6 text-[#121212] shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#121212]/15 pb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#121212]" />
            <h3 className="text-xl font-serif font-bold tracking-tight">
              {user && user.provider !== 'guest' ? 'Account Portal' : 'Studio Authentication'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 bg-[#121212] text-[#F7F5F2] hover:bg-[#262626] cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Supabase Status Indicator */}
        <div className="p-3 bg-[#F7F5F2] border border-[#121212]/15 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono">
            <Database className="w-4 h-4 text-[#121212]/70" />
            <span className="font-bold">Database Engine:</span>
          </div>
          <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 border ${
            isSupabaseConfigured
              ? 'bg-emerald-50 border-emerald-600/30 text-emerald-800'
              : 'bg-amber-50 border-amber-600/30 text-amber-900'
          }`}>
            {isSupabaseConfigured ? '● Supabase Active' : '○ Local Supabase Auth'}
          </span>
        </div>

        {/* If user is already logged in */}
        {user && user.provider !== 'guest' ? (
          <div className="space-y-5 text-left">
            <div className="p-4 bg-[#F7F5F2] border border-[#121212]/15 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#121212]/60">Active Session</span>
                <span className="text-[10px] font-mono uppercase font-bold text-[#121212] bg-white border border-[#121212]/20 px-2 py-0.5">
                  {user.provider}
                </span>
              </div>
              <p className="text-base font-serif font-bold text-[#121212]">{user.name || 'Creator User'}</p>
              <p className="text-xs text-[#121212]/70 font-mono">{user.email}</p>
            </div>

            <div className="p-3 bg-white border border-[#121212]/15 text-xs text-[#121212]/80 font-serif italic">
              Your prompt history, favorite visuals, and n8n pipelines are linked to this profile.
            </div>

            <button
              onClick={() => {
                signOut();
                onClose();
              }}
              className="w-full py-3 bg-[#121212] hover:bg-red-700 text-[#F7F5F2] font-bold text-xs uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out Account</span>
            </button>
          </div>
        ) : (
          <div className="space-y-5 text-left">
            {/* Auth Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#F7F5F2] border border-[#121212]/15">
              <button
                onClick={() => { setMode('signin'); setError(null); }}
                className={`py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  mode === 'signin' ? 'bg-[#121212] text-[#F7F5F2]' : 'text-[#121212]/70 hover:text-[#121212]'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setMode('signup'); setError(null); }}
                className={`py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  mode === 'signup' ? 'bg-[#121212] text-[#F7F5F2]' : 'text-[#121212]/70 hover:text-[#121212]'
                }`}
              >
                Sign Up
              </button>
              <button
                onClick={() => { setMode('magic'); setError(null); }}
                className={`py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  mode === 'magic' ? 'bg-[#121212] text-[#F7F5F2]' : 'text-[#121212]/70 hover:text-[#121212]'
                }`}
              >
                Magic Link
              </button>
            </div>

            {/* OAuth Quick Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleOAuth('google')}
                className="py-2.5 px-3 bg-white border border-[#121212]/20 hover:border-[#121212] text-xs font-bold text-[#121212] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Chrome className="w-4 h-4" />
                <span>Google Login</span>
              </button>
              <button
                onClick={() => handleOAuth('github')}
                className="py-2.5 px-3 bg-white border border-[#121212]/20 hover:border-[#121212] text-xs font-bold text-[#121212] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Github className="w-4 h-4" />
                <span>GitHub Login</span>
              </button>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-[#121212]/15 w-full"></div>
              <span className="bg-white px-2 text-[10px] font-mono uppercase text-[#121212]/50 font-bold relative z-10">Or Email</span>
            </div>

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'signup' && (
                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold tracking-wider text-[#121212]/70 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Sounava Das"
                    className="w-full bg-white border border-[#121212]/20 px-3 py-2 text-xs text-[#121212] placeholder-[#121212]/40 focus:outline-none focus:border-[#121212]"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-mono uppercase font-bold tracking-wider text-[#121212]/70 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-[#121212]/40 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="creator@schrodinger.ai"
                    className="w-full bg-white border border-[#121212]/20 pl-9 pr-3 py-2 text-xs text-[#121212] placeholder-[#121212]/40 focus:outline-none focus:border-[#121212]"
                  />
                </div>
              </div>

              {mode !== 'magic' && (
                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold tracking-wider text-[#121212]/70 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Key className="w-3.5 h-3.5 text-[#121212]/40 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white border border-[#121212]/20 pl-9 pr-3 py-2 text-xs text-[#121212] placeholder-[#121212]/40 focus:outline-none focus:border-[#121212]"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-800 text-xs font-serif italic">
                  {error}
                </div>
              )}

              {message && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-xs font-serif italic">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#121212] hover:bg-[#262626] text-[#F7F5F2] font-bold text-xs uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>
                  {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Magic Link'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-2 border-t border-[#121212]/10 flex items-center justify-between">
              <button
                onClick={() => {
                  signInAsGuest();
                  onClose();
                }}
                className="text-xs text-[#121212]/60 hover:text-[#121212] font-mono underline cursor-pointer"
              >
                Continue as Guest
              </button>
              <span className="text-[10px] font-mono text-[#121212]/40 uppercase">Supabase Sync Ready</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
