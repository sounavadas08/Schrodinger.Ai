import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AuthUser } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isSupabaseConfigured: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  signInWithMagicLink: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<{ success: boolean; error?: string }>;
  signInAsGuest: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync user state with local storage for easy cross-module access
  useEffect(() => {
    if (user) {
      localStorage.setItem('schrodinger_user_session', JSON.stringify(user));
    } else {
      localStorage.removeItem('schrodinger_user_session');
    }
  }, [user]);

  const fetchAndRestoreUserSettings = async (userId: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', userId)
          .single();
        if (data && !error) {
          localStorage.setItem('ai_provider', data.ai_provider || 'auto');
          localStorage.setItem('cf_account_id', data.cf_account_id || '');
          localStorage.setItem('cf_api_token', data.cf_api_token || '');
          localStorage.setItem('gemini_api_key', data.gemini_api_key || '');
        }
      } catch (err) {
        console.warn('Failed to restore user settings from Supabase:', err);
      }
    }
  };

  useEffect(() => {
    // Check initial local session or Supabase session
    const initAuth = async () => {
      try {
        // 1. First check server-side Passport session
        try {
          const meRes = await fetch('/auth/me');
          const meData = await meRes.json();
          if (meData.authenticated && meData.user) {
            setUser({
              id: meData.user.id,
              email: meData.user.email || '',
              name: meData.user.name || meData.user.email?.split('@')[0],
              avatarUrl: meData.user.avatarUrl,
              provider: meData.user.provider || 'oauth'
            });
            await fetchAndRestoreUserSettings(meData.user.id);
            setLoading(false);
            return;
          }
        } catch {
          // Server session check failed, continue to Supabase/local
        }

        // 2. Check for auth redirect query params (from Passport callback)
        const urlParams = new URLSearchParams(window.location.search);
        const authSuccess = urlParams.get('auth_success');
        const authError = urlParams.get('auth_error');
        if (authSuccess || authError) {
          // Clean up URL
          window.history.replaceState({}, '', window.location.pathname);
          if (authSuccess) {
            // Re-fetch /auth/me after redirect
            try {
              const meRes = await fetch('/auth/me');
              const meData = await meRes.json();
              if (meData.authenticated && meData.user) {
                setUser({
                  id: meData.user.id,
                  email: meData.user.email || '',
                  name: meData.user.name || meData.user.email?.split('@')[0],
                  avatarUrl: meData.user.avatarUrl,
                  provider: meData.user.provider || 'oauth'
                });
                await fetchAndRestoreUserSettings(meData.user.id);
                setLoading(false);
                return;
              }
            } catch { /* fallthrough */ }
          }
        }

        // 3. Supabase session check
        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
              avatarUrl: session.user.user_metadata?.avatar_url,
              provider: 'supabase'
            });
            // Restore user API keys from database
            await fetchAndRestoreUserSettings(session.user.id);
          }

          // Listen for auth state changes from Supabase
          supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
                avatarUrl: session.user.user_metadata?.avatar_url,
                provider: 'supabase'
              });
              await fetchAndRestoreUserSettings(session.user.id);
            } else {
              // check if local guest user exists
              const savedUser = localStorage.getItem('schrodinger_local_user');
              if (savedUser) {
                setUser(JSON.parse(savedUser));
              } else {
                setUser(null);
              }
            }
          });
        } else {
          // Check local storage session
          const savedUser = localStorage.getItem('schrodinger_local_user');
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          } else {
            // Set default guest session so user can use history out of the box
            const defaultGuest: AuthUser = {
              id: 'guest_user_default',
              email: 'guest@schrodinger.ai',
              name: 'Creator Guest',
              provider: 'guest'
            };
            setUser(defaultGuest);
            localStorage.setItem('schrodinger_local_user', JSON.stringify(defaultGuest));
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signInWithEmail = async (email: string, pass: string) => {
    const blockKey = `login_block_${email}`;
    const attemptsKey = `login_attempts_${email}`;

    // Check lockout status
    const blockedUntil = localStorage.getItem(blockKey);
    if (blockedUntil && Date.now() < Number(blockedUntil)) {
      const remainingMin = Math.ceil((Number(blockedUntil) - Date.now()) / 60000);
      return { 
        success: false, 
        error: `Too many failed attempts. Try again in ${remainingMin} minute${remainingMin > 1 ? 's' : ''}.` 
      };
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) {
        // Track failures
        const currentAttempts = (Number(localStorage.getItem(attemptsKey)) || 0) + 1;
        if (currentAttempts >= 3) {
          localStorage.setItem(blockKey, String(Date.now() + 15 * 60 * 1000)); // 15 mins block
          localStorage.removeItem(attemptsKey);
          return { success: false, error: 'Too many failed login attempts. Try again in 15 minutes.' };
        } else {
          localStorage.setItem(attemptsKey, String(currentAttempts));
          return { success: false, error: `${error.message} (${3 - currentAttempts} attempts remaining)` };
        }
      }
      // Reset attempts on success
      localStorage.removeItem(attemptsKey);
      localStorage.removeItem(blockKey);

      if (data.user) {
        const u: AuthUser = {
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.user_metadata?.full_name || email.split('@')[0],
          provider: 'supabase'
        };
        setUser(u);
        await fetchAndRestoreUserSettings(data.user.id);
        return { success: true };
      }
    }

    // Local authentication fallback for direct testing
    const localDb = JSON.parse(localStorage.getItem('schrodinger_local_users') || '{}');
    const existingLocalUser = localDb[email.toLowerCase()];
    const correctPass = existingLocalUser ? existingLocalUser.password : "creator123";

    if (pass !== correctPass) {
      const currentAttempts = (Number(localStorage.getItem(attemptsKey)) || 0) + 1;
      if (currentAttempts >= 3) {
        localStorage.setItem(blockKey, String(Date.now() + 15 * 60 * 1000)); // 15 mins block
        localStorage.removeItem(attemptsKey);
        return { success: false, error: 'Too many failed login attempts. Try again in 15 minutes.' };
      } else {
        localStorage.setItem(attemptsKey, String(currentAttempts));
        return { success: false, error: `Incorrect password. (${3 - currentAttempts} attempts remaining)` };
      }
    }

    // Reset attempts on success
    localStorage.removeItem(attemptsKey);
    localStorage.removeItem(blockKey);

    const localUser: AuthUser = {
      id: existingLocalUser?.id || `user_${Date.now()}`,
      email,
      name: existingLocalUser?.name || email.split('@')[0],
      provider: 'email'
    };
    setUser(localUser);
    localStorage.setItem('schrodinger_local_user', JSON.stringify(localUser));
    return { success: true };
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: { data: { full_name: name || email.split('@')[0] } }
      });
      if (error) return { success: false, error: error.message };
      if (data.user) {
        const u: AuthUser = {
          id: data.user.id,
          email: data.user.email || email,
          name: name || email.split('@')[0],
          provider: 'supabase'
        };
        setUser(u);
        return { success: true };
      }
    }

    // Fallback local registration
    if (pass.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    // Store in local storage mock database
    const localDb = JSON.parse(localStorage.getItem('schrodinger_local_users') || '{}');
    const normalizedEmail = email.toLowerCase();
    
    localDb[normalizedEmail] = {
      id: `user_${Date.now()}`,
      password: pass,
      name: name || email.split('@')[0]
    };
    localStorage.setItem('schrodinger_local_users', JSON.stringify(localDb));

    const localUser: AuthUser = {
      id: localDb[normalizedEmail].id,
      email,
      name: localDb[normalizedEmail].name,
      provider: 'email'
    };
    setUser(localUser);
    localStorage.setItem('schrodinger_local_user', JSON.stringify(localUser));
    return { success: true };
  };

  const signInWithMagicLink = async (email: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) return { success: false, error: error.message };
      return { success: true, message: 'Magic login link dispatched to your inbox!' };
    }

    // Fallback magic link simulation
    const localUser: AuthUser = {
      id: `magic_${Date.now()}`,
      email,
      name: email.split('@')[0],
      provider: 'email'
    };
    setUser(localUser);
    localStorage.setItem('schrodinger_local_user', JSON.stringify(localUser));
    return { success: true, message: 'Magic link authenticated! Welcome back.' };
  };

  // OAuth via Supabase natively when configured, falling back to server Passport.js
  const signInWithOAuth = async (provider: 'google' | 'github') => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    }

    // Fallback redirect to local express server OAuth routes
    window.location.href = `/auth/${provider}`;
    return { success: true };
  };

  const signInAsGuest = () => {
    const guestUser: AuthUser = {
      id: `guest_${Date.now()}`,
      email: 'guest@schrodinger.ai',
      name: 'Creator Guest',
      provider: 'guest'
    };
    setUser(guestUser);
    localStorage.setItem('schrodinger_local_user', JSON.stringify(guestUser));
  };

  const signOut = async () => {
    // Destroy server-side Passport session
    try {
      await fetch('/auth/logout', { method: 'POST' });
    } catch { /* ignore if server unreachable */ }

    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('schrodinger_local_user');
    const guest: AuthUser = {
      id: 'guest_user_default',
      email: 'guest@schrodinger.ai',
      name: 'Creator Guest',
      provider: 'guest'
    };
    setUser(guest);
    localStorage.setItem('schrodinger_local_user', JSON.stringify(guest));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isSupabaseConfigured,
        signInWithEmail,
        signUpWithEmail,
        signInWithMagicLink,
        signInWithOAuth,
        signInAsGuest,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
