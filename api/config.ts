import { getGenAIClient, getCloudflareConfig } from "./helpers.js";

export default async function handler(req: any, res: any) {
  let errorInfo: any = null;
  try {
    const generateImageModule = await import("./generate-image.js");
    const mockReq = {
      body: {},
      headers: {}
    };
    let capturedStatus = 200;
    let capturedJson: any = null;
    const mockRes = {
      status: (code: number) => {
        capturedStatus = code;
        return mockRes;
      },
      json: (data: any) => {
        capturedJson = data;
        return mockRes;
      }
    };
    await generateImageModule.default(mockReq, mockRes);
    errorInfo = {
      success: true,
      status: capturedStatus,
      json: capturedJson
    };
  } catch (err: any) {
    errorInfo = {
      success: false,
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

