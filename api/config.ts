import { getGenAIClient, getCloudflareConfig } from "./helpers.js";

export default async function handler(req: any, res: any) {
  let errorInfo: any = null;
  try {
    const cfConfig = getCloudflareConfig(req, "tts");
    if (!cfConfig) {
      errorInfo = { error: "Cloudflare credentials not found" };
    } else {
      const cfModel = "@cf/deepgram/aura-1";
      const url = `https://api.cloudflare.com/client/v4/accounts/${cfConfig.accountId}/ai/run/${cfModel}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${cfConfig.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: "Hello test" }),
      });
      const json = await response.json().catch(() => null);
      errorInfo = {
        status: response.status,
        body: json
      };
    }
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



