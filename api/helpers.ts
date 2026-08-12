export const Type = {
  STRING: "STRING",
  NUMBER: "NUMBER",
  INTEGER: "INTEGER",
  BOOLEAN: "BOOLEAN",
  ARRAY: "ARRAY",
  OBJECT: "OBJECT",
  NULL: "NULL",
  UNSPECIFIED: "UNSPECIFIED",
} as const;

// Minimal request shape so the same helpers work for both the Express server
// (server.ts) and Vercel serverless functions (api/*.ts).
export interface ReqLike {
  headers?: Record<string, string | string[] | undefined>;
  query?: Record<string, any>;
}

let cachedGenAIModule: typeof import("@google/genai") | null = null;
let genAILoadError: string | null = null;

async function loadGenAIModule(): Promise<typeof import("@google/genai") | null> {
  if (cachedGenAIModule) return cachedGenAIModule;
  if (genAILoadError) return null;
  try {
    cachedGenAIModule = await import("@google/genai");
    return cachedGenAIModule;
  } catch (err: any) {
    genAILoadError = err?.message || "unknown";
    console.warn("Failed to load @google/genai:", genAILoadError);
    return null;
  }
}

// Helper: Get Gemini API client if key present
export async function getGenAIClient(req?: ReqLike) {
  const headerKey = (typeof req?.headers?.["x-gemini-api-key"] === "string") ? req.headers["x-gemini-api-key"] as string : "";
  const envKey = process.env.GEMINI_API_KEY;
  const apiKey = (headerKey && headerKey.trim() !== "") ? headerKey : envKey;

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }

  const mod = await loadGenAIModule();
  if (!mod) return null;

  return new mod.GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "schrodinger-ai-build",
      },
    },
  });
}

// Helper: Get Cloudflare Workers AI credentials
// `feature` lets a section use its own token (CLOUDFLARE_IMAGE_TOKEN / CLOUDFLARE_TTS_TOKEN)
// while still falling back to the shared CLOUDFLARE_API_TOKEN. Request headers override env.
export const getCloudflareConfig = (req?: ReqLike, feature: "image" | "tts" | "default" = "default") => {
  const envTokenKey = feature === "image" ? "CLOUDFLARE_IMAGE_TOKEN"
    : feature === "tts" ? "CLOUDFLARE_TTS_TOKEN"
    : "CLOUDFLARE_API_TOKEN";

  const headerAccountId = (typeof req?.headers?.["x-cloudflare-account-id"] === "string") ? req.headers["x-cloudflare-account-id"] as string : "";
  const headerApiToken = (typeof req?.headers?.["x-cloudflare-api-token"] === "string") ? req.headers["x-cloudflare-api-token"] as string : "";

  const accountId = (headerAccountId && headerAccountId.trim() !== "") ? headerAccountId : process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = (headerApiToken && headerApiToken.trim() !== "")
    ? headerApiToken
    : process.env[envTokenKey] || process.env.CLOUDFLARE_API_TOKEN;

  if (accountId && apiToken) {
    return { accountId, apiToken };
  }
  return null;
};

// Helper: Resolve effective provider from header (set via Settings modal) or request body
export const getProvider = (req?: ReqLike, bodyProvider: string = "auto"): "auto" | "cloudflare" | "gemini" => {
  const headerProvider = (typeof req?.headers?.["x-provider"] === "string") ? req.headers["x-provider"] as string : "";
  const normalized = headerProvider.trim().toLowerCase();
  if (normalized === "cloudflare" || normalized === "gemini" || normalized === "auto") {
    return normalized as "auto" | "cloudflare" | "gemini";
  }
  if (bodyProvider === "cloudflare" || bodyProvider === "gemini" || bodyProvider === "auto") {
    return bodyProvider as "auto" | "cloudflare" | "gemini";
  }
  return "auto";
};

// Helper: Call Cloudflare Workers AI REST API
export async function callCloudflareWorkersAI(accountId: string, apiToken: string, model: string, payload: any) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("image/") || contentType.includes("application/octet-stream")) {
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mime = contentType.includes("image/jpeg") ? "image/jpeg" : "image/png";
    return { isImage: true, dataUrl: `data:${mime};base64,${base64}` };
  }

  const jsonResult = await response.json();
  return { isImage: false, result: jsonResult };
}

// Helper: Extract valid JSON from an LLM response (strips code fences, repairs trailing commas)
export function extractJson(text: string): any | null {
  if (!text) return null;
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    // ignore
  }
  const objMatch = cleaned.match(/\{[\s\S]*\}/);
  const arrMatch = cleaned.match(/\[[\s\S]*\]/);
  for (const m of [objMatch, arrMatch]) {
    if (!m) continue;
    let candidate = m[0];
    candidate = candidate.replace(/,(\s*[\]}])/g, "$1");
    try {
      return JSON.parse(candidate);
    } catch (error) {
      // ignore
    }
  }
  return null;
}

// IP counts cache for best-effort in-memory fallback
const ipCounts: Record<string, number> = {};

let cachedSupabase: any = null;
async function getSupabase() {
  if (cachedSupabase) return cachedSupabase;
  const url = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (url && key && !url.includes("YOUR_SUPABASE")) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      cachedSupabase = createClient(url, key);
    } catch (e) {
      console.warn("Failed to load @supabase/supabase-js dynamically:", e);
    }
  }
  return cachedSupabase;
}

export async function checkIpLimit(req: any): Promise<{ allowed: boolean; error?: string }> {
  // 1. Check if user is logged in via request headers
  const userId = req.headers?.["x-user-id"];
  const isGuest = !userId || userId.startsWith("guest_") || userId === "guest_user_default";

  if (!isGuest) {
    return { allowed: true };
  }

  // 2. Resolve client IP
  const forwarded = req.headers?.["x-forwarded-for"];
  const rawIp = typeof forwarded === "string" ? forwarded.split(",")[0] : (req.headers?.["x-real-ip"] || req.ip || "unknown");
  const ip = (Array.isArray(rawIp) ? rawIp[0] : String(rawIp)).trim();

  if (ip === "unknown") {
    return { allowed: true }; // allow if IP cannot be resolved
  }

  // 3. Check Supabase first if configured
  const supabaseClient = await getSupabase();
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from("ip_usage")
        .select("count")
        .eq("ip", ip)
        .maybeSingle(); // maybeSingle returns null instead of throwing 406 on no rows
      
      if (error) {
        throw new Error(error.message);
      }
      
      let currentCount = data ? data.count : 0;
      if (currentCount >= 3) {
        return { 
          allowed: false, 
          error: "Free usage limit exceeded (3 requests max per device). Please log in to continue using Schrödinger AI tools." 
        };
      }

      // Increment count in Supabase
      const { error: upsertError } = await supabaseClient.from("ip_usage").upsert({
        ip,
        count: currentCount + 1,
        last_request: new Date().toISOString()
      });

      if (upsertError) {
        throw new Error(upsertError.message);
      }
      return { allowed: true };
    } catch (e: any) {
      console.warn("Supabase IP limit check failed, falling back to memory:", e.message);
    }
  }

  // 4. In-memory fallback
  const currentCount = ipCounts[ip] || 0;
  if (currentCount >= 3) {
    return { 
      allowed: false, 
      error: "Free usage limit exceeded (3 requests max per device). Please log in to continue using Schrödinger AI tools." 
    };
  }

  ipCounts[ip] = currentCount + 1;
  return { allowed: true };
}
