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
  } catch {
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
    } catch {
      // ignore
    }
  }
  return null;
}
