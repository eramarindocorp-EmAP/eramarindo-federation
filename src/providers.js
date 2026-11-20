const OPENAI_COMPATIBLE = {
  openai: { endpoint: "https://api.openai.com/v1/chat/completions", key: "OPENAI_API_KEY", model: "OPENAI_MODEL" },
  deepseek: { endpoint: "https://api.deepseek.com/chat/completions", key: "DEEPSEEK_API_KEY", model: "DEEPSEEK_MODEL" }
};

const PROVIDER_ERROR_HINTS = {
  insufficient_quota: "API quota or credits are exhausted, or a billing limit was reached. Check provider billing, available credits, and project/organization spend limits.",
  rate_limit_exceeded: "API request or token rate limit was reached. Reduce request frequency or token throughput, then retry after the provider reset window.",
  billing_hard_limit_reached: "The provider hard spending limit was reached. Review the project or organization budget limit.",
  organization_deactivated: "The provider organization is deactivated. Contact the organization owner or provider support.",
  project_rate_limit_exceeded: "The provider project rate limit was reached. Review project limits and retry after the reset window."
};

export function providerError(provider, status, payload = {}) {
  const details = payload && typeof payload.error === "object" && payload.error !== null ? payload.error : {};
  const rawCode = typeof details.code === "string" ? details.code : "";
  const rawType = typeof details.type === "string" ? details.type : "";
  const code = (rawCode || rawType).toLowerCase();
  const hint = PROVIDER_ERROR_HINTS[code];
  const generic = status === 429
    ? "Provider returned HTTP 429. Check billing/quota, project and organization spend limits, and request/token rate limits."
    : `Provider returned HTTP ${status}.`;
  const error = new Error(`${provider}: ${hint || generic}${code ? ` [${code}]` : ""}`);
  error.status = status >= 500 ? 502 : 400;
  error.providerCode = code || undefined;
  return error;
}

async function readJson(response, provider) {
  const raw = await response.text();
  let data = {};
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      if (response.ok) throw new Error(`${provider} provider returned an invalid JSON response`);
    }
  }
  if (!response.ok) throw providerError(provider, response.status, data);
  return data;
}

export async function callProvider({ provider, model, messages, system, signal, env = process.env }) {
  if (OPENAI_COMPATIBLE[provider]) {
    const config = OPENAI_COMPATIBLE[provider];
    const apiKey = env[config.key];
    const selectedModel = model || env[config.model];
    if (!apiKey || !selectedModel) throw new Error(`${provider} is not configured`);
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ model: selectedModel, messages: [...(system ? [{ role: "system", content: system }] : []), ...messages] }),
      signal
    });
    const data = await readJson(response, provider);
    return {
      provider, model: data.model || selectedModel,
      message: data.choices?.[0]?.message ?? null,
      usage: data.usage ?? null
    };
  }

  if (provider === "gemini") {
    const apiKey = env.GEMINI_API_KEY;
    const selectedModel = model || env.GEMINI_MODEL;
    if (!apiKey || !selectedModel) throw new Error("gemini is not configured");
    const contents = messages.map((item) => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: typeof item.content === "string" ? item.content : JSON.stringify(item.content) }]
    }));
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(selectedModel)}:generateContent`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "content-type": "application/json" },
      body: JSON.stringify({
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        contents
      }),
      signal
    });
    const data = await readJson(response, provider);
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
    return {
      provider, model: selectedModel,
      message: { role: "assistant", content: text },
      usage: data.usageMetadata ?? null
    };
  }

  throw new Error("Provider is not supported");
}
