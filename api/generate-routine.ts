import { getGenAIClient, getCloudflareConfig, getProvider, callCloudflareWorkersAI, extractJson, Type, checkIpLimit } from "./helpers.js";

export default async function handler(req: any, res: any) {
  try {
    const ipCheck = await checkIpLimit(req);
    if (!ipCheck.allowed) {
      return res.status(429).json({ error: ipCheck.error });
    }

    const { niche = "Tech Content Creator", frequency = "Daily", hoursPerDay = "4", lifestyle = "", provider: bodyProvider = "auto" } = req.body || {};
    const provider = getProvider(req, bodyProvider);

    const aiGen = await getGenAIClient(req);
    const cfConfig = getCloudflareConfig(req);

    const lifestyleClause = lifestyle && lifestyle.trim()
      ? ` The creator described their lifestyle as: "${lifestyle.trim()}". Tailor the routine realistically to this lifestyle, energy levels, and constraints — do not invent commitments they didn't mention.`
      : "";

    if ((provider === "cloudflare" || provider === "auto") && cfConfig) {
      try {
        const cfModel = "@cf/meta/llama-3.1-8b-instruct";
        const promptText = `Generate a JSON daily routine for a creator in the "${niche}" niche who posts "${frequency}" and works "${hoursPerDay} hours per day".${lifestyleClause} Return JSON with keys: summary (string) and items (array of {time, activity, category, description}). Do not include extra text.`;

        const cfRes = await callCloudflareWorkersAI(cfConfig.accountId, cfConfig.apiToken, cfModel, {
          messages: [
            { role: "system", content: "You are an AI creator coach that responds strictly with valid JSON." },
            { role: "user", content: promptText },
          ],
          max_tokens: 1536,
        });

        let outputText: any = cfRes.result?.result?.response ?? cfRes.result?.response;
        if (outputText && typeof outputText !== "string") outputText = JSON.stringify(outputText);
        if (outputText) {
          const parsed = extractJson(outputText);
          if (parsed && parsed.summary && Array.isArray(parsed.items)) {
            return res.status(200).json({
              success: true,
              niche,
              frequency,
              hoursPerDay,
              summary: parsed.summary,
              items: parsed.items,
              source: "cloudflare",
            });
          }
        }
      } catch (err: any) {
        console.warn("Cloudflare Routine generation failed:", err?.message || err);
      }
    }

    if ((provider === "gemini" || provider === "auto") && aiGen) {
      try {
        const response = await aiGen.models.generateContent({
          model: "gemini-3.6-flash",
          contents: `Create a highly structured daily routine for a creator in the "${niche}" niche who posts "${frequency}" and can dedicate "${hoursPerDay} hours per day". Provide JSON matching schema.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      time: { type: Type.STRING },
                      activity: { type: Type.STRING },
                      category: { type: Type.STRING, description: "Strategy, Creation, Editing, Analytics, or Rest" },
                      description: { type: Type.STRING },
                    },
                    required: ["time", "activity", "category", "description"],
                  },
                },
              },
              required: ["summary", "items"],
            },
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          return res.status(200).json({
            success: true,
            niche,
            frequency,
            hoursPerDay,
            summary: parsed.summary,
            items: parsed.items,
            source: "gemini",
          });
        }
      } catch (err: any) {
        console.warn("Gemini Routine generation failed:", err?.message || err);
      }
    }

    const fallbackItems = [
      {
        time: "08:00 AM - 09:00 AM",
        activity: "Trend Research & Script Drafting",
        category: "Strategy",
        description: `Analyze top-performing competitor hooks in ${niche} & finalize 2 script outlines.`,
      },
      {
        time: "09:15 AM - 10:45 AM",
        activity: "A-Roll Recording & B-Roll Capture",
        category: "Creation",
        description: `Set up high-key lighting, record 4K main camera voiceover & b-roll overlays.`,
      },
      {
        time: "11:00 AM - 12:30 PM",
        activity: "Pacing & Motion Graphics Editing",
        category: "Editing",
        description: "Cut silent pauses, insert jump-cuts, add animated captions & sound effects.",
      },
      {
        time: "01:30 PM - 02:30 PM",
        activity: "Thumbnail Design & SEO Optimization",
        category: "Strategy",
        description: "Create 3 high-contrast thumbnail variants with AI masks & write clickable titles.",
      },
      {
        time: "02:30 PM - 03:00 PM",
        activity: "Analytics Review & Audience Engagement",
        category: "Analytics",
        description: "Reply to top 20 comments on recent upload & log retention drop-off points.",
      },
    ];

    res.status(200).json({
      success: true,
      niche,
      frequency,
      hoursPerDay,
      summary: `Optimized ${hoursPerDay}-hour daily high-velocity workflow engineered specifically for ${niche} growth.`,
      items: fallbackItems,
      source: "fallback",
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to generate routine" });
  }
}
