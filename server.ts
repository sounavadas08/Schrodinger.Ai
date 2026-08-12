import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Helper: Get Gemini API client if key present
const getGenAIClient = async (req?: express.Request) => {
  const headerKey = req?.headers['x-gemini-api-key'] as string;
  const envKey = process.env.GEMINI_API_KEY;
  const apiKey = (headerKey && headerKey.trim() !== '') ? headerKey : envKey;

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }

  try {
    const { GoogleGenAI } = await import("@google/genai");
    return new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'schrodinger-ai-build',
        }
      }
    });
  } catch (err: any) {
    console.warn("Failed to load @google/genai:", err?.message);
    return null;
  }
};

// Helper: Get Cloudflare Workers AI credentials
// `feature` lets a section use its own token (CLOUDFLARE_IMAGE_TOKEN / CLOUDFLARE_TTS_TOKEN)
// while still falling back to the shared CLOUDFLARE_API_TOKEN. Request headers override env.
const getCloudflareConfig = (req?: express.Request, feature: "image" | "tts" | "default" = "default") => {
  const envTokenKey = feature === "image" ? "CLOUDFLARE_IMAGE_TOKEN"
    : feature === "tts" ? "CLOUDFLARE_TTS_TOKEN"
    : "CLOUDFLARE_API_TOKEN";

  const headerAccountId = req?.headers['x-cloudflare-account-id'] as string;
  const headerApiToken = req?.headers['x-cloudflare-api-token'] as string;

  const accountId = (headerAccountId && headerAccountId.trim() !== '') ? headerAccountId : process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = (headerApiToken && headerApiToken.trim() !== '') ? headerApiToken
    : process.env[envTokenKey]
    || process.env.CLOUDFLARE_API_TOKEN;

  if (accountId && apiToken) {
    return { accountId, apiToken };
  }
  return null;
};

// Helper: Resolve effective provider from header (set via Settings modal) or request body
const getProvider = (req?: express.Request, bodyProvider: string = "auto"): "auto" | "cloudflare" | "gemini" => {
  const headerProvider = (req?.headers['x-provider'] as string) || "";
  const normalized = headerProvider.trim().toLowerCase();
  if (normalized === "cloudflare" || normalized === "gemini" || normalized === "auto") {
    return normalized;
  }
  if (bodyProvider === "cloudflare" || bodyProvider === "gemini" || bodyProvider === "auto") {
    return bodyProvider as "auto" | "cloudflare" | "gemini";
  }
  return "auto";
};

// Helper: Call Cloudflare Workers AI REST API
async function callCloudflareWorkersAI(accountId: string, apiToken: string, model: string, payload: any) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
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
function extractJson(text: string): any | null {
  if (!text) return null;
  let cleaned = text.trim();
  // Remove markdown code fences if present
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  // Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch {
    // ignore
  }
  // Fallback: extract first balanced JSON object or array
  const objMatch = cleaned.match(/\{[\s\S]*\}/);
  const arrMatch = cleaned.match(/\[[\s\S]*\]/);
  for (const m of [objMatch, arrMatch]) {
    if (!m) continue;
    let candidate = m[0];
    // Repair trailing commas before } or ]
    candidate = candidate.replace(/,(\s*[\]}])/g, "$1");
    try {
      return JSON.parse(candidate);
    } catch {
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
      console.warn("Failed to load @supabase/supabase-js dynamically in server.ts:", e);
    }
  }
  return cachedSupabase;
}

async function checkIpLimit(req: express.Request): Promise<{ allowed: boolean; error?: string }> {
  // 1. Check if user is logged in via request headers
  const userId = req.headers["x-user-id"];
  const isGuest = !userId || userId === "guest_user_default" || (typeof userId === "string" && userId.startsWith("guest_"));

  if (!isGuest) {
    return { allowed: true };
  }

  // 2. Resolve client IP
  const forwarded = req.headers["x-forwarded-for"];
  const rawIp = typeof forwarded === "string" ? forwarded.split(",")[0] : (req.headers["x-real-ip"] || req.ip || "unknown");
  const ip = (Array.isArray(rawIp) ? rawIp[0] : String(rawIp)).trim();

  console.log(`[checkIpLimit] userId=${userId}, isGuest=${isGuest}, rawIp=${rawIp}, ip=${ip}, ipCounts=${JSON.stringify(ipCounts)}`);

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
      console.warn("Supabase IP limit check failed in server.ts, falling back to memory:", e.message);
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

// System Status / Config Endpoint
app.get("/api/config", async (req, res) => {
  const cf = getCloudflareConfig(req);
  const gemini = await getGenAIClient(req);
  // Supabase is a client-side SDK; the browser reports its own config via header.
  const supabaseConfiguredHeader = req.headers['x-supabase-configured'];
  const supabaseConfigured = supabaseConfiguredHeader === 'true' || supabaseConfiguredHeader === '1';
  res.json({
    success: true,
    cloudflareConfigured: !!cf,
    geminiConfigured: !!gemini,
    supabaseConfigured,
    nodeEnv: process.env.NODE_ENV || "development"
  });
});

// 1. Image Generation Endpoint
app.post("/api/generate-image", async (req, res) => {
  try {
    const ipCheck = await checkIpLimit(req);
    if (!ipCheck.allowed) {
      return res.status(429).json({ error: ipCheck.error });
    }

    const { prompt, aspectRatio = "1:1", provider: bodyProvider = "auto" } = req.body;
    const provider = getProvider(req, bodyProvider);
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const cfConfig = getCloudflareConfig(req, "image");

    // Image generation is handled exclusively by Cloudflare Workers AI (SDXL).
    // Gemini image models are intentionally NOT used as a fallback: the configured
    // Gemini account rejects image-input requests, which surfaced as
    // "this model does not support image input".
    if ((provider === "cloudflare" || provider === "auto") && cfConfig) {
      try {
        const cfModel = "@cf/stabilityai/stable-diffusion-xl-base-1.0";
        const cfRes = await callCloudflareWorkersAI(cfConfig.accountId, cfConfig.apiToken, cfModel, {
          prompt: prompt
        });

        if (cfRes.isImage && cfRes.dataUrl) {
          return res.json({
            success: true,
            imageUrl: cfRes.dataUrl,
            prompt,
            source: "cloudflare",
            model: cfModel
          });
        }
      } catch (cfErr: any) {
        console.warn("Cloudflare Workers AI Image Generation failed:", cfErr?.message || cfErr);
        return res.status(502).json({
          success: false,
          error: "Image generation failed on Cloudflare Workers AI. Verify the image API token has SDXL access.",
        });
      }
    }

    if (provider === "gemini") {
      return res.status(400).json({
        success: false,
        error: "Image generation is provided by Cloudflare Workers AI (SDXL). Gemini image models are not enabled for this account.",
      });
    }

    return res.status(400).json({
      success: false,
      error: "Image generation requires a configured Cloudflare Workers AI account (set CLOUDFLARE_IMAGE_TOKEN).",
    });

  } catch (error: any) {
    console.error("Image generation route error:", error);
    res.status(500).json({ error: error.message || "Failed to generate image" });
  }
});

// 2. AI Routine Maker Endpoint
app.post("/api/generate-routine", async (req, res) => {
  try {
    const ipCheck = await checkIpLimit(req);
    if (!ipCheck.allowed) {
      return res.status(429).json({ error: ipCheck.error });
    }

    const { niche = "Tech Content Creator", frequency = "Daily", hoursPerDay = "4", lifestyle = "", provider: bodyProvider = "auto" } = req.body;
    const provider = getProvider(req, bodyProvider);

    const cfConfig = getCloudflareConfig(req);
    const aiGen = await getGenAIClient(req);

    const lifestyleClause = lifestyle && lifestyle.trim()
      ? ` The creator described their lifestyle as: "${lifestyle.trim()}". Tailor the routine realistically to this lifestyle, energy levels, and constraints — do not invent commitments they didn't mention.`
      : "";

    // 1. Try Cloudflare Workers AI if configured
    if ((provider === "cloudflare" || provider === "auto") && cfConfig) {
      try {
        const cfModel = "@cf/meta/llama-3.1-8b-instruct";
        const promptText = `Generate a JSON daily routine for a creator in the "${niche}" niche who posts "${frequency}" and works "${hoursPerDay} hours per day".${lifestyleClause} Return JSON with keys: summary (string) and items (array of {time, activity, category, description}). Do not include extra text.`;
        
        const cfRes = await callCloudflareWorkersAI(cfConfig.accountId, cfConfig.apiToken, cfModel, {
          messages: [
            { role: "system", content: "You are an AI creator coach that responds strictly with valid JSON." },
            { role: "user", content: promptText }
          ],
          max_tokens: 1536
        });

        let outputText: any = cfRes.result?.result?.response ?? cfRes.result?.response;
        if (outputText && typeof outputText !== "string") outputText = JSON.stringify(outputText);
        if (outputText) {
          const parsed = extractJson(outputText);
          if (parsed && parsed.summary && Array.isArray(parsed.items)) {
              return res.json({
                success: true,
                niche,
                frequency,
                hoursPerDay,
                summary: parsed.summary,
                items: parsed.items,
                source: "cloudflare"
              });
            }
          }
      } catch (err: any) {
        console.warn("Cloudflare Routine generation failed:", err?.message || err);
      }
    }

    // 2. Try Gemini AI if configured
    if ((provider === "gemini" || provider === "auto") && aiGen) {
      try {
        const response = await aiGen.models.generateContent({
          model: "gemini-3.6-flash",
          contents: `Create a highly structured daily routine for a creator in the "${niche}" niche who posts "${frequency}" and can dedicate "${hoursPerDay} hours per day". Provide JSON matching schema.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      time: { type: Type.STRING },
                      activity: { type: Type.STRING },
                      category: { type: Type.STRING, description: "Strategy, Creation, Editing, Analytics, or Rest" },
                      description: { type: Type.STRING }
                    },
                    required: ["time", "activity", "category", "description"]
                  }
                }
              },
              required: ["summary", "items"]
            }
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          return res.json({
            success: true,
            niche,
            frequency,
            hoursPerDay,
            summary: parsed.summary,
            items: parsed.items,
            source: "gemini"
          });
        }
      } catch (err: any) {
        console.warn("Gemini Routine generation failed:", err?.message || err);
      }
    }

    // High quality fallback schedule
    const fallbackItems = [
      {
        time: "08:00 AM - 09:00 AM",
        activity: "Trend Research & Script Drafting",
        category: "Strategy",
        description: `Analyze top-performing competitor hooks in ${niche} & finalize 2 script outlines.`
      },
      {
        time: "09:15 AM - 10:45 AM",
        activity: "A-Roll Recording & B-Roll Capture",
        category: "Creation",
        description: `Set up high-key lighting, record 4K main camera voiceover & b-roll overlays.`
      },
      {
        time: "11:00 AM - 12:30 PM",
        activity: "Pacing & Motion Graphics Editing",
        category: "Editing",
        description: "Cut silent pauses, insert jump-cuts, add animated captions & sound effects."
      },
      {
        time: "01:30 PM - 02:30 PM",
        activity: "Thumbnail Design & SEO Optimization",
        category: "Strategy",
        description: "Create 3 high-contrast thumbnail variants with AI masks & write clickable titles."
      },
      {
        time: "02:30 PM - 03:00 PM",
        activity: "Analytics Review & Audience Engagement",
        category: "Analytics",
        description: "Reply to top 20 comments on recent upload & log retention drop-off points."
      }
    ];

    res.json({
      success: true,
      niche,
      frequency,
      hoursPerDay,
      summary: `Optimized ${hoursPerDay}-hour daily high-velocity workflow engineered specifically for ${niche} growth.`,
      items: fallbackItems,
      source: "fallback"
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to generate routine" });
  }
});

// 2b. Script Generator Endpoint (genre + topic -> written script)
app.post("/api/generate-script", async (req, res) => {
  try {
    const ipCheck = await checkIpLimit(req);
    if (!ipCheck.allowed) {
      return res.status(429).json({ error: ipCheck.error });
    }

    const { genre = "YouTube Explainer", topic = "", tone = "engaging", provider: bodyProvider = "auto" } = req.body;
    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: "A content topic is required" });
    }
    const provider = getProvider(req, bodyProvider);
    const cfConfig = getCloudflareConfig(req);
    const aiGen = await getGenAIClient(req);

    const buildScript = (body: string) =>
      `Write a complete, production-ready ${genre} script about "${topic.trim()}". ` +
      `Tone: ${tone}. Include a hook, clear sections with short directions in [brackets], and a strong closing CTA. ` +
      `Return strictly as JSON: { "title": string, "hook": string, "sections": array of { "heading": string, "narration": string, "direction": string }, "outro": string }. No markdown.`;

    if ((provider === "cloudflare" || provider === "auto") && cfConfig) {
      try {
        const cfModel = "@cf/meta/llama-3.1-8b-instruct";
        const cfRes = await callCloudflareWorkersAI(cfConfig.accountId, cfConfig.apiToken, cfModel, {
          messages: [
            { role: "system", content: "You are a professional scriptwriter. Respond strictly with valid JSON." },
            { role: "user", content: buildScript("cf") }
          ],
          max_tokens: 1536
        });
        let outputText: any = cfRes.result?.result?.response ?? cfRes.result?.response;
        if (outputText && typeof outputText !== "string") outputText = JSON.stringify(outputText);
        if (outputText) {
          const parsed = extractJson(outputText);
          if (parsed && parsed.title && Array.isArray(parsed.sections)) {
            return res.json({ success: true, genre, topic: topic.trim(), script: parsed, source: "cloudflare" });
          }
        }
      } catch (err: any) {
        console.warn("Cloudflare Script generation failed:", err?.message || err);
      }
    }

    if ((provider === "gemini" || provider === "auto") && aiGen) {
      try {
        const response = await aiGen.models.generateContent({
          model: "gemini-3.6-flash",
          contents: buildScript("gemini"),
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                hook: { type: Type.STRING },
                sections: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      heading: { type: Type.STRING },
                      narration: { type: Type.STRING },
                      direction: { type: Type.STRING }
                    },
                    required: ["heading", "narration", "direction"]
                  }
                },
                outro: { type: Type.STRING }
              },
              required: ["title", "hook", "sections", "outro"]
            }
          }
        });
        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          return res.json({ success: true, genre, topic: topic.trim(), script: parsed, source: "gemini" });
        }
      } catch (err: any) {
        console.warn("Gemini Script generation failed:", err?.message || err);
      }
    }

    return res.status(502).json({
      success: false,
      error: "Script generation requires a configured Cloudflare or Gemini provider.",
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to generate script" });
  }
});

// 3. Content Creator Auto-Plan Endpoint
app.post("/api/plan-content", async (req, res) => {
  try {
    const ipCheck = await checkIpLimit(req);
    if (!ipCheck.allowed) {
      return res.status(429).json({ error: ipCheck.error });
    }

    const { niche = "Tech & AI", platform = "YouTube", provider: bodyProvider = "auto" } = req.body;
    const provider = getProvider(req, bodyProvider);

    const cfConfig = getCloudflareConfig(req);
    const aiGen = await getGenAIClient(req);

    if ((provider === "cloudflare" || provider === "auto") && cfConfig) {
      try {
        const cfModel = "@cf/meta/llama-3.1-8b-instruct";
        const promptText = `Generate 4 fresh viral content ideas for a ${niche} creator posting on ${platform}. Return a valid JSON array of objects with keys: platform, theme, snippet. Do not include markdown codeblocks or extra text.`;

        const cfRes = await callCloudflareWorkersAI(cfConfig.accountId, cfConfig.apiToken, cfModel, {
          messages: [
            { role: "system", content: "You are a social media strategist returning strictly JSON array." },
            { role: "user", content: promptText }
          ],
          max_tokens: 1024
        });

        let outputText: any = cfRes.result?.result?.response ?? cfRes.result?.response;
        if (outputText && typeof outputText !== "string") outputText = JSON.stringify(outputText);
        if (outputText) {
          const parsed = extractJson(outputText);
          if (parsed && Array.isArray(parsed) && parsed.length > 0) {
            return res.json({ success: true, items: parsed, source: "cloudflare" });
          }
        }
      } catch (err: any) {
        console.warn("Cloudflare Content Planner failed:", err?.message);
      }
    }

    if ((provider === "gemini" || provider === "auto") && aiGen) {
      try {
        const response = await aiGen.models.generateContent({
          model: "gemini-3.6-flash",
          contents: `Generate 4 fresh viral content ideas for a ${niche} creator posting on ${platform}. Provide structured JSON array.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  platform: { type: Type.STRING },
                  theme: { type: Type.STRING },
                  snippet: { type: Type.STRING }
                },
                required: ["platform", "theme", "snippet"]
              }
            }
          }
        });

        if (response.text) {
          const items = JSON.parse(response.text.trim());
          return res.json({ success: true, items, source: "gemini" });
        }
      } catch (err: any) {
        console.warn("Gemini Content Planner fallback:", err?.message);
      }
    }

    // Fallback plans
    const today = new Date();
    const formatDate = (offset: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() + offset);
      return d.toISOString().split('T')[0];
    };

    const fallbackItems = [
      {
        date: formatDate(1),
        platform: "YouTube",
        theme: "Top 5 Free AI Tools Better Than ChatGPT Plus",
        snippet: "Hook: 'Stop paying $20/mo! These 5 hidden open-source models do full multimodal tasks for free...'",
        status: "Drafted"
      },
      {
        date: formatDate(3),
        platform: "Instagram",
        theme: "How I Automated My Entire Video Editing Workflow",
        snippet: "Reel Carousel: 3-step breakdown showing n8n webhook → Auto-subtitle generation → Drive export.",
        status: "Approved"
      },
      {
        date: formatDate(5),
        platform: "X (Twitter)",
        theme: "The Future of Autonomous AI Agents in 2026",
        snippet: "Thread: 1/7 AI agents are no longer chatbots. Here's how multi-agent frameworks run actual businesses...",
        status: "Scheduled"
      },
      {
        date: formatDate(7),
        platform: "TikTok",
        theme: "POV: You let AI schedule your entire creator business",
        snippet: "Fast-paced screen recording showing SchrodingerAi auto-generating routines & syncing Google Sheets.",
        status: "Drafted"
      }
    ];

    res.json({ success: true, items: fallbackItems, source: "fallback" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to plan content" });
  }
});

// 4. YouTube to MP3 Endpoint
app.post("/api/youtube-to-mp3", async (req, res) => {
  try {
    const { url, bitrate = "320" } = req.body;
    if (!url || (!url.includes("youtube.com") && !url.includes("youtu.be"))) {
      return res.status(400).json({ error: "Please enter a valid YouTube video URL" });
    }

    const match = url.match(/(?:v=|\/)([\w-]{11})/);
    const videoId = match ? match[1] : "dQw4w9WgXcQ";

    // Attempt to download using Cobalt API instances (with failover)
    const cobaltInstances = [
      "https://rue-cobalt.xenon.zone/",
      "https://cobaltapi.cjs.nz/"
    ];

    for (const cobaltUrl of cobaltInstances) {
      try {
        const cobaltRes = await fetch(cobaltUrl, {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          },
          body: JSON.stringify({
            url: url,
            downloadMode: "audio",
            audioFormat: "mp3",
            audioBitrate: bitrate
          })
        });

        if (cobaltRes.ok) {
          const cobaltData = await cobaltRes.json();
          if (cobaltData && cobaltData.url) {
            return res.json({
              success: true,
              videoId,
              title: cobaltData.filename || "Extracted Audio Stream",
              channel: "Cobalt Audio Service",
              duration: "N/A",
              bitrate: `${bitrate} kbps`,
              fileSize: "Dynamic Stream",
              thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
              audioUrl: cobaltData.url,
              message: "Audio stream extracted successfully from YouTube in real-time!",
            });
          }
        }
      } catch (err: any) {
        console.warn(`Cobalt extraction failed on ${cobaltUrl}:`, err.message);
      }
    }

    // Graceful fallback to mock data
    res.json({
      success: true,
      videoId,
      title: "Mastering Creator Automation & AI Workflows [2026 Tutorial]",
      channel: "Schrödinger AI Labs (Fallback)",
      duration: "14:32",
      bitrate: `${bitrate} kbps`,
      fileSize: "12.4 MB",
      thumbnail: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80`,
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      message: "API fallback: Static audio demo stream served successfully."
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to convert YouTube video" });
  }
});

// 5. Instagram Downloader Endpoint
app.post("/api/ig-download", async (req, res) => {
  try {
    const { url, format = "MP4 Video" } = req.body;
    if (!url || !url.includes("instagram.com")) {
      return res.status(400).json({ error: "Please enter a valid Instagram post or reel URL" });
    }

    const isImage = format === "High-Res Image";

    // Attempt to download using Cobalt API instances (with failover)
    const cobaltInstances = [
      "https://rue-cobalt.xenon.zone/",
      "https://cobaltapi.cjs.nz/"
    ];

    for (const cobaltUrl of cobaltInstances) {
      try {
        const cobaltRes = await fetch(cobaltUrl, {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          },
          body: JSON.stringify({
            url: url,
            downloadMode: isImage ? "mute" : "auto", // mute means video only, auto is regular download
            videoQuality: "1080"
          })
        });

        if (cobaltRes.ok) {
          const cobaltData = await cobaltRes.json();
          if (cobaltData && cobaltData.url) {
            return res.json({
              success: true,
              format,
              author: "@creator.instagram",
              caption: cobaltData.filename || "Extracted Instagram Media",
              likes: "N/A",
              views: "N/A",
              thumbnail: isImage ? cobaltData.url : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
              downloadUrl: cobaltData.url,
              mediaType: isImage ? "image" : "video",
              message: `Instagram ${isImage ? "photo" : "video"} extracted successfully in real-time!`,
            });
          }
        }
      } catch (err: any) {
        console.warn(`Cobalt extraction failed on ${cobaltUrl}:`, err.message);
      }
    }

    // Graceful fallback to mock data
    res.json({
      success: true,
      format,
      author: "@schrodingerai.official (Fallback)",
      caption: "Automating content creation like a breeze 🚀 #SchrodingerAi #AIStudio #CreatorTools",
      likes: "18.4K",
      views: "142.9K",
      thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
      downloadUrl: isImage
        ? "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1080&q=80"
        : "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      mediaType: isImage ? "image" : "video",
      message: `API fallback: Instagram ${isImage ? "photo" : "video"} asset ready for download (demo)`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to extract Instagram media" });
  }
});

// 6. Weather Endpoint
app.get("/api/weather", (req, res) => {
  const cityQuery = (req.query.city as string) || "San Francisco";
  
  const citiesData: Record<string, any> = {
    "london": { tempC: 18, tempF: 64, condition: "Partly Cloudy", humidity: 62, windSpeed: 14, uvIndex: 4 },
    "new york": { tempC: 24, tempF: 75, condition: "Sunny", humidity: 48, windSpeed: 9, uvIndex: 7 },
    "tokyo": { tempC: 22, tempF: 72, condition: "Clear Sky", humidity: 55, windSpeed: 11, uvIndex: 6 },
    "mumbai": { tempC: 31, tempF: 88, condition: "Humid & Clear", humidity: 78, windSpeed: 12, uvIndex: 8 },
    "berlin": { tempC: 19, tempF: 66, condition: "Light Breezy", humidity: 50, windSpeed: 15, uvIndex: 5 },
    "san francisco": { tempC: 20, tempF: 68, condition: "Sunny Coastal", humidity: 58, windSpeed: 10, uvIndex: 6 }
  };

  const key = cityQuery.toLowerCase().trim();
  const data = citiesData[key] || {
    tempC: 22 + Math.floor(Math.random() * 8),
    tempF: 72 + Math.floor(Math.random() * 12),
    condition: "Sunny Clear",
    humidity: 50 + Math.floor(Math.random() * 20),
    windSpeed: 8 + Math.floor(Math.random() * 10),
    uvIndex: 5
  };

  res.json({
    success: true,
    city: cityQuery.charAt(0).toUpperCase() + cityQuery.slice(1),
    tempC: data.tempC,
    tempF: data.tempF,
    condition: data.condition,
    humidity: data.humidity,
    windSpeed: data.windSpeed,
    uvIndex: data.uvIndex,
    forecast: [
      { day: "Tomorrow", tempC: data.tempC + 1, tempF: data.tempF + 2, condition: "Sunny" },
      { day: "Day 2", tempC: data.tempC - 1, tempF: data.tempF - 2, condition: "Partly Cloudy" },
      { day: "Day 3", tempC: data.tempC + 2, tempF: data.tempF + 4, condition: "Clear Sky" }
    ]
  });
});

// 7. n8n Automation Trigger Proxy Endpoint (Live Webhook Execution)
app.post("/api/n8n/trigger", async (req, res) => {
  const { workflowId, webhookUrl, apiKey, customPayload } = req.body;

  const targetUrl = webhookUrl || (workflowId ? `https://primary-production.n8n.cloud/webhook/${workflowId}` : null);

  if (!targetUrl) {
    return res.status(400).json({ error: "Missing webhook URL or Workflow ID" });
  }

  const startTime = Date.now();
  const executionId = `exec_${Math.random().toString(36).substring(2, 9)}`;

  try {
    if (webhookUrl && (webhookUrl.startsWith("http://") || webhookUrl.startsWith("https://"))) {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
        headers["X-N8N-API-KEY"] = apiKey;
      }

      const webhookResponse = await fetch(targetUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(customPayload || {
          source: "Schrödinger AI Client",
          timestamp: new Date().toISOString(),
          executionId,
          status: "triggered"
        })
      });

      const elapsed = Date.now() - startTime;
      let resData = {};
      try {
        resData = await webhookResponse.json();
      } catch {
        resData = { message: `Webhook responded with status ${webhookResponse.status}` };
      }

      return res.json({
        success: webhookResponse.ok,
        executionId,
        timestamp: new Date().toISOString(),
        status: webhookResponse.ok ? "finished" : "failed",
        statusCode: webhookResponse.status,
        durationMs: elapsed,
        data: resData
      });
    }

    // No valid webhook URL provided — report failure instead of faking success
    return res.status(400).json({
      success: false,
      executionId,
      timestamp: new Date().toISOString(),
      status: "failed",
      statusCode: 400,
      durationMs: Date.now() - startTime,
      error: "No reachable n8n webhook URL provided. Configure a valid instance URL + workflow webhook to execute real workflows.",
      data: {
        status: "error",
        message: "Workflow was not executed. Provide a valid webhookUrl or workflowId pointing to a live n8n instance."
      }
    });
  } catch (err: any) {
    console.warn("Live webhook dispatch error:", err?.message || err);
    const elapsed = Date.now() - startTime;
    return res.status(502).json({
      success: false,
      executionId,
      timestamp: new Date().toISOString(),
      status: "failed",
      statusCode: 502,
      durationMs: elapsed,
      error: err?.message || "Failed to dispatch webhook to n8n instance.",
      data: { status: "error", message: "Webhook dispatch failed. Verify the n8n instance URL and network connectivity." }
    });
  }
});

// 8. Text to Speech Endpoint (Cloudflare Workers AI MeloTTS)
app.post("/api/text-to-speech", async (req, res) => {
  try {
    const ipCheck = await checkIpLimit(req);
    if (!ipCheck.allowed) {
      return res.status(429).json({ error: ipCheck.error });
    }

    const { text, lang = "en" } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Text is required" });
    }
    if (text.length > 1300) {
      return res.status(400).json({ error: "Text exceeds 1300 character limit for TTS" });
    }

    const cfConfig = getCloudflareConfig(req, "tts");
    if (cfConfig) {
      // 1. Try Deepgram Aura-1 first (stable, low-latency, returns binary stream)
      try {
        const cfModel = "@cf/deepgram/aura-1";
        const url = `https://api.cloudflare.com/client/v4/accounts/${cfConfig.accountId}/ai/run/${cfModel}`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${cfConfig.apiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
        });

        if (response.ok) {
          const buffer = await response.arrayBuffer();
          const audioB64 = Buffer.from(buffer).toString("base64");
          if (audioB64 && audioB64.length > 100) {
            return res.json({
              success: true,
              audioUrl: `data:audio/mpeg;base64,${audioB64}`,
              source: "cloudflare (aura-1)",
            });
          }
        }
      } catch (err: any) {
        console.warn("Cloudflare Deepgram Aura-1 failed, trying MeloTTS fallback:", err.message);
      }

      // 2. Fallback to MeloTTS (if Aura-1 fails)
      try {
        const cfModel = "@cf/myshell-ai/melotts";
        const url = `https://api.cloudflare.com/client/v4/accounts/${cfConfig.accountId}/ai/run/${cfModel}`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${cfConfig.apiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: text, lang }),
        });

        const json = await response.json().catch(() => null);
        const audioB64 = json?.result?.audio;
        if (audioB64) {
          return res.json({
            success: true,
            audioUrl: `data:audio/mpeg;base64,${audioB64}`,
            source: "cloudflare (melotts)",
          });
        }
      } catch (err: any) {
        console.warn("Cloudflare MeloTTS failed:", err.message);
      }
    }

    return res.status(502).json({
      success: false,
      error: "Text-to-speech is currently unavailable on Cloudflare Workers AI due to capacity limits. Please use the BROWSER SPEAK option below.",
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to synthesize speech" });
  }
});

// Vite Middleware for Dev / Static serving for Production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Schrödinger AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
