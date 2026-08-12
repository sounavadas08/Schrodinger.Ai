import { getGenAIClient, getCloudflareConfig } from "./helpers.js";

export default async function handler(req: any, res: any) {
  let errorInfo: any = null;
  try {
    // Try to dynamically import generate-image to see why it crashes
    await import("./generate-image.js");
  } catch (err: any) {
    errorInfo = {
      message: err.message,
      stack: err.stack,
      code: err.code
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

