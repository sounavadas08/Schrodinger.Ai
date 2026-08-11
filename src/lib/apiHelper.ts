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
