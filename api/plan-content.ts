import { getGenAIClient, getCloudflareConfig, getProvider, callCloudflareWorkersAI, extractJson, Type } from "./helpers.js";

export default async function handler(req: any, res: any) {
  try {
    const { niche = "Tech & AI", platform = "YouTube", provider: bodyProvider = "auto" } = req.body || {};
    const provider = getProvider(req, bodyProvider);

    const cfConfig = getCloudflareConfig(req);
    const aiGen = await getGenAIClient(req);

    if ((provider === "cloudflare" || provider === "auto") && cfConfig) {
      try {
        const cfModel = "@cf/meta/llama-3.1-8b-instruct";
        const promptText = `Generate 4 fresh viral content ideas for a ${niche} creator posting on ${platform}. Return a valid JSON array of objects with keys: platform, theme, snippet. Do not include markdown codeblocks or extra text.`;

        const cfRes = await callCloudflareWorkersAI(cfConfig.accountId, cfConfig.apiToken, cfModel, {
          messages: [
            { role: "system", content: "You are a social media strategist returning strictly JSON array." },
            { role: "user", content: promptText },
          ],
          max_tokens: 1024,
        });

        let outputText: any = cfRes.result?.result?.response ?? cfRes.result?.response;
        if (outputText && typeof outputText !== "string") outputText = JSON.stringify(outputText);
        if (outputText) {
          const parsed = extractJson(outputText);
          if (parsed && Array.isArray(parsed) && parsed.length > 0) {
            return res.status(200).json({ success: true, items: parsed, source: "cloudflare" });
          }
        }
      } catch (err: any) {
        console.warn("Cloudflare Content Planner failed:", err?.message);
      }
    }

    if ((provider === "gemini" || provider === "auto") && aiGen) {
      try {
        const response = await aiGen.models.generateContent({
          model: "gemini-3.6-flash",
          contents: `Generate 4 fresh viral content ideas for a ${niche} creator posting on ${platform}. Provide structured JSON array.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  platform: { type: Type.STRING },
                  theme: { type: Type.STRING },
                  snippet: { type: Type.STRING },
                },
                required: ["platform", "theme", "snippet"],
              },
            },
          },
        });

        if (response.text) {
          const items = JSON.parse(response.text.trim());
          return res.status(200).json({ success: true, items, source: "gemini" });
        }
      } catch (err: any) {
        console.warn("Gemini Content Planner fallback:", err?.message);
      }
    }

    const today = new Date();
    const formatDate = (offset: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() + offset);
      return d.toISOString().split("T")[0];
    };

    const fallbackItems = [
      { date: formatDate(1), platform: "YouTube", theme: "Top 5 Free AI Tools Better Than ChatGPT Plus", snippet: "Hook: 'Stop paying $20/mo! These 5 hidden open-source models do full multimodal tasks for free...'", status: "Drafted" },
      { date: formatDate(3), platform: "Instagram", theme: "How I Automated My Entire Video Editing Workflow", snippet: "Reel Carousel: 3-step breakdown showing n8n webhook → Auto-subtitle generation → Drive export.", status: "Approved" },
      { date: formatDate(5), platform: "X (Twitter)", theme: "The Future of Autonomous AI Agents in 2026", snippet: "Thread: 1/7 AI agents are no longer chatbots. Here's how multi-agent frameworks run actual businesses...", status: "Scheduled" },
      { date: formatDate(7), platform: "TikTok", theme: "POV: You let AI schedule your entire creator business", snippet: "Fast-paced screen recording showing SchrodingerAi auto-generating routines & syncing Google Sheets.", status: "Drafted" },
    ];

    res.status(200).json({ success: true, items: fallbackItems, source: "fallback" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to plan content" });
  }
}
