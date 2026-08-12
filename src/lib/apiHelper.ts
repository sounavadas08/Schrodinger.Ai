export function getApiHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (typeof window !== 'undefined') {
    const provider = localStorage.getItem('ai_provider');
    const cfAccountId = localStorage.getItem('cf_account_id');
    const cfApiToken = localStorage.getItem('cf_api_token');
    const geminiApiKey = localStorage.getItem('gemini_api_key');

    if (provider) headers['x-provider'] = provider;
    if (cfAccountId) headers['x-cloudflare-account-id'] = cfAccountId;
    if (cfApiToken) headers['x-cloudflare-api-token'] = cfApiToken;
    if (geminiApiKey) headers['x-gemini-api-key'] = geminiApiKey;

    const userSessionStr = localStorage.getItem('schrodinger_user_session');
    if (userSessionStr) {
      try {
        const user = JSON.parse(userSessionStr);
        if (user && user.id) {
          headers['x-user-id'] = user.id;
          headers['x-user-provider'] = user.provider || 'guest';
        }
      } catch (e) {
        // ignore
      }
    }

    const viteSupabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const viteSupabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
    const supabaseConfigured = Boolean(
      viteSupabaseUrl && viteSupabaseKey &&
      viteSupabaseUrl.trim() !== '' && viteSupabaseKey.trim() !== '' &&
      !viteSupabaseUrl.includes('YOUR_SUPABASE')
    );
    if (supabaseConfigured) headers['x-supabase-configured'] = 'true';
  }

  return headers;
}

/**
 * Safely parse a fetch Response as JSON.
 * If the server returns HTML or plain-text (e.g. an unhandled crash), this
 * returns a structured error object instead of throwing "Unexpected token".
 */
export async function safeResponseJson(response: Response): Promise<any> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    // Server returned non-JSON (HTML error page, plain-text crash message, etc.)
    return {
      success: false,
      error: response.ok
        ? 'Server returned an unexpected response. Please try again.'
        : `Server error ${response.status}: ${text.slice(0, 120)}`,
    };
  }
}

