import { getGenAIClient, getCloudflareConfig } from "./helpers.js";

export default async function handler(req: any, res: any) {
  const instances = [
    "https://cobaltapi.cjs.nz/",
    "https://rue-cobalt.xenon.zone/",
    "https://cobaltapi.squair.xyz/",
    "https://apicobalt.mgytr.top/",
    "https://cobalt-api.lamps-dev.dev/",
    "https://nuko-c.meowing.de/",
    "https://subito-c.meowing.de/",
    "https://api.qwkuns.me/",
    "https://cobaltapi.kittycat.boo/",
    "https://lime.clxxped.lol/",
    "https://grapefruit.clxxped.lol/"
  ];

  const results: any[] = [];

  for (const api of instances) {
    try {
      const start = Date.now();
      const response = await fetch(api, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        body: JSON.stringify({
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          downloadMode: "audio",
          audioFormat: "mp3"
        })
      });

      const body = await response.json().catch(() => null);
      results.push({
        api,
        status: response.status,
        duration: Date.now() - start,
        body
      });
    } catch (err: any) {
      results.push({
        api,
        error: err.message
      });
    }
  }

  const cf = getCloudflareConfig(req);
  const gemini = await getGenAIClient(req);
  const supabaseConfiguredHeader = req.headers?.["x-supabase-configured"];
  const supabaseConfigured = supabaseConfiguredHeader === "true" || supabaseConfiguredHeader === "1";
  res.status(200).json({
    success: true,
    cloudflareConfigured: !!cf,
    geminiConfigured: !!gemini,
    supabaseConfigured,
    nodeEnv: process.env.NODE_ENV || "development",
    cobaltResults: results
  });
}




