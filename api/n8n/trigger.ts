export default async function handler(req: any, res: any) {
  const { workflowId, webhookUrl, apiKey, customPayload } = req.body || {};

  const targetUrl = webhookUrl || (workflowId ? `https://primary-production.n8n.cloud/webhook/${workflowId}` : null);

  if (!targetUrl) {
    return res.status(400).json({ error: "Missing webhook URL or Workflow ID" });
  }

  const startTime = Date.now();
  const executionId = `exec_${Math.random().toString(36).substring(2, 9)}`;

  try {
    if (webhookUrl && (webhookUrl.startsWith("http://") || webhookUrl.startsWith("https://"))) {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
        headers["X-N8N-API-KEY"] = apiKey;
      }

      const webhookResponse = await fetch(targetUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(customPayload || {
          source: "Schrödinger AI Client",
          timestamp: new Date().toISOString(),
          executionId,
          status: "triggered",
        }),
      });

      const elapsed = Date.now() - startTime;
      let resData = {};
      try {
        resData = await webhookResponse.json();
      } catch {
        resData = { message: `Webhook responded with status ${webhookResponse.status}` };
      }

      return res.status(200).json({
        success: webhookResponse.ok,
        executionId,
        timestamp: new Date().toISOString(),
        status: webhookResponse.ok ? "finished" : "failed",
        statusCode: webhookResponse.status,
        durationMs: elapsed,
        data: resData,
      });
    }

    return res.status(400).json({
      success: false,
      executionId,
      timestamp: new Date().toISOString(),
      status: "failed",
      statusCode: 400,
      durationMs: Date.now() - startTime,
      error: "No reachable n8n webhook URL provided. Configure a valid instance URL + workflow webhook to execute real workflows.",
      data: {
        status: "error",
        message: "Workflow was not executed. Provide a valid webhookUrl or workflowId pointing to a live n8n instance.",
      },
    });
  } catch (err: any) {
    console.warn("Live webhook dispatch error:", err?.message || err);
    const elapsed = Date.now() - startTime;
    return res.status(502).json({
      success: false,
      executionId,
      timestamp: new Date().toISOString(),
      status: "failed",
      statusCode: 502,
      durationMs: elapsed,
      error: err?.message || "Failed to dispatch webhook to n8n instance.",
      data: { status: "error", message: "Webhook dispatch failed. Verify the n8n instance URL and network connectivity." },
    });
  }
}
