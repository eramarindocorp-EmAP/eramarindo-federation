const OPENAI_COMPATIBLE = {
  openai: { endpoint: "https://api.openai.com/v1/chat/completions", key: "OPENAI_API_KEY", model: "OPENAI_MODEL" },
  deepseek: { endpoint: "https://api.deepseek.com/chat/completions", key: "DEEPSEEK_API_KEY", model: "DEEPSEEK_MODEL" }
};

function providerError(provider, status) {
  const error = new Error(`${provider} provider returned HTTP ${status}`);
  error.status = status >= 500 ? 502 : 400;
  return error;
}

async function readJson(response, provider) {
  if (!response.ok) throw providerError(provider, response.status);
  return response.json();
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
