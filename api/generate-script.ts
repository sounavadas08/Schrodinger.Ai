import { getGenAIClient, getCloudflareConfig, getProvider, callCloudflareWorkersAI, extractJson, Type } from "./helpers.js";

export default async function handler(req: any, res: any) {
  try {
    const { genre = "YouTube Explainer", topic = "", tone = "engaging", provider: bodyProvider = "auto" } = req.body || {};
    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: "A content topic is required" });
    }
    const provider = getProvider(req, bodyProvider);
    const aiGen = await getGenAIClient(req);
    const cfConfig = getCloudflareConfig(req);

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
            { role: "user", content: buildScript("cf") },
          ],
          max_tokens: 1536,
        });
        let outputText: any = cfRes.result?.result?.response ?? cfRes.result?.response;
        if (outputText && typeof outputText !== "string") outputText = JSON.stringify(outputText);
        if (outputText) {
          const parsed = extractJson(outputText);
          if (parsed && parsed.title && Array.isArray(parsed.sections)) {
            return res.status(200).json({ success: true, genre, topic: topic.trim(), script: parsed, source: "cloudflare" });
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
                      direction: { type: Type.STRING },
                    },
                    required: ["heading", "narration", "direction"],
                  },
                },
                outro: { type: Type.STRING },
              },
              required: ["title", "hook", "sections", "outro"],
            },
          },
        });
        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          return res.status(200).json({ success: true, genre, topic: topic.trim(), script: parsed, source: "gemini" });
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
}
