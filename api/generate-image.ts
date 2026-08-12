import { getGenAIClient, getCloudflareConfig, getProvider, callCloudflareWorkersAI, checkIpLimit } from "./helpers.js";


export default async function handler(req: any, res: any) {
  try {
    const ipCheck = await checkIpLimit(req);
    if (!ipCheck.allowed) {
      return res.status(429).json({ error: ipCheck.error });
    }

    const { prompt, aspectRatio = "1:1", provider: bodyProvider = "auto" } = req.body || {};
    const provider = getProvider(req, bodyProvider);
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const aiGen = await getGenAIClient(req);
    const cfConfig = getCloudflareConfig(req, "image");

    // Image generation is handled exclusively by Cloudflare Workers AI (SDXL).
    // Gemini image models are intentionally NOT used as a fallback: the configured
    // Gemini account rejects image-input requests, which surfaced as
    // "this model does not support image input".
    if ((provider === "cloudflare" || provider === "auto") && cfConfig) {
      try {
        const cfModel = "@cf/stabilityai/stable-diffusion-xl-base-1.0";
        const cfRes = await callCloudflareWorkersAI(cfConfig.accountId, cfConfig.apiToken, cfModel, {
          prompt: prompt,
        });

        if (cfRes.isImage && cfRes.dataUrl) {
          return res.status(200).json({
            success: true,
            imageUrl: cfRes.dataUrl,
            prompt,
            source: "cloudflare",
            model: cfModel,
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
}
