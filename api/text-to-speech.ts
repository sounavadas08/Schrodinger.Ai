import { getCloudflareConfig, checkIpLimit } from "./helpers.js";

export default async function handler(req: any, res: any) {
  try {
    const ipCheck = await checkIpLimit(req);
    if (!ipCheck.allowed) {
      return res.status(429).json({ error: ipCheck.error });
    }

    const { text, lang = "en" } = req.body || {};
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
            return res.status(200).json({
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
          return res.status(200).json({
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
}
