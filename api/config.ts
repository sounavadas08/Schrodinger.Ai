import { getGenAIClient, getCloudflareConfig } from "./_lib/helpers.ts";

export default async function handler(req: any, res: any) {
  const cf = getCloudflareConfig(req);
  const gemini = getGenAIClient(req);
  const supabaseConfiguredHeader = req.headers?.["x-supabase-configured"];
  const supabaseConfigured = supabaseConfiguredHeader === "true" || supabaseConfiguredHeader === "1";
  res.status(200).json({
    success: true,
    cloudflareConfigured: !!cf,
    geminiConfigured: !!gemini,
    supabaseConfigured,
    nodeEnv: process.env.NODE_ENV || "development",
  });
}
