import { getGenAIClient, getCloudflareConfig } from "./helpers.js";

export default async function handler(req: any, res: any) {
  let errorInfo: any = null;
  try {
    const res = await fetch("https://rue-cobalt.xenon.zone/", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      body: JSON.stringify({
        url: "https://youtube.com/shorts/q09N1KzvNH8?si=mWVC_XWwKurqCw",
        downloadMode: "audio",
        audioFormat: "mp3",
        audioBitrate: "320"
      })
    });
    errorInfo = {
      status: res.status,
      body: await res.json().catch(() => null)
    };
  } catch (err: any) {
    errorInfo = {
      error: err.message
    };
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
    errorInfo
  });
}



