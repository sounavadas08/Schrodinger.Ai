import { getCloudflareConfig } from "./helpers.js";

export default async function handler(req: any, res: any) {
  try {
    const { text, lang = "en" } = req.body || {};
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Text is required" });
    }
    if (text.length > 1300) {
      return res.status(400).json({ error: "Text exceeds 1300 character limit for TTS" });
    }

    const cfConfig = getCloudflareConfig(req, "tts");
    if (cfConfig) {
      // Retry once to absorb Cloudflare Workers AI transient "Internal server error" (code 3043)
      for (let attempt = 0; attempt < 2; attempt++) {
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
              source: "cloudflare",
            });
          }
          console.warn("Cloudflare TTS returned no audio:", json?.errors || json?.message || "unknown");
        } catch (err: any) {
          console.warn("Cloudflare TTS failed:", err?.message || err);
        }
      }
    }

    return res.status(502).json({
      success: false,
      error: "Text-to-speech is unavailable. Configure a Cloudflare Workers AI account (with MeloTTS access) in Settings or .env to enable audio generation.",
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to synthesize speech" });
  }
}
