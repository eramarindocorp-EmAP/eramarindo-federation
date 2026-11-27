const SUPPORTED = new Set(["openai", "deepseek", "gemini", "perplexity", "anthropic"]);

function normalize(text) {
  return String(text ?? "").trim().toLowerCase().replace(/\\s+/g, " ");
}

function contentOf(result) {
  return typeof result?.message?.content === "string" ? result.message.content : "";
}

function validatePlan(plan, enabledProviders) {
  const mode = plan?.mode || "single";
  if (!["single", "parallel", "consensus", "fallback"].includes(mode)) {
    throw Object.assign(new Error("mode must be single, parallel, consensus, or fallback"), { status: 400 });
  }
  const requested = mode === "single" ? [plan.provider] : plan.providers;
  if (!Array.isArray(requested) || requested.length < 1 || requested.length > 5 ||
      requested.some((provider) => typeof provider !== "string" || !SUPPORTED.has(provider.toLowerCase()))) {
    throw Object.assign(new Error("provider selection must contain 1–5 supported providers"), { status: 400 });
  }
  const providers = [...new Set(requested.map((provider) => provider.toLowerCase()))];
  if (providers.length !== requested.length) {
    throw Object.assign(new Error("provider selection must not contain duplicates"), { status: 400 });
  }
  if (mode === "single" && providers.length !== 1) {
    throw Object.assign(new Error("single mode requires exactly one provider"), { status: 400 });
  }
  if (mode !== "single" && providers.length < 2) {
    throw Object.assign(new Error(`${mode} mode requires at least two providers`), { status: 400 });
  }
  const disabled = providers.filter((provider) => !enabledProviders.has(provider));
  if (disabled.length) {
    throw Object.assign(new Error(`provider disabled: ${disabled.join(", ")}`), { status: 400 });
  }
  return { mode, providers };
}

export async function orchestrate({ plan, messages, system, enabledProviders, call, signal }) {
  const { mode, providers } = validatePlan(plan, enabledProviders);
  const invoke = async (provider) => {
    try {
      const result = await call({ provider, model: plan.models?.[provider], messages, system, signal });
      return { provider, ok: true, model: result.model, content: contentOf(result), usage: result.usage ?? null };
    } catch (error) {
      return { provider, ok: false, error: error.message || "Provider request failed" };
    }
  };

  if (mode === "single") {
    const result = await invoke(providers[0]);
    if (!result.ok) throw Object.assign(new Error(result.error), { status: 502 });
    return { mode, status: "completed", selected: result.provider, results: [result] };
  }

  if (mode === "fallback") {
    const attempts = [];
    for (const provider of providers) {
      const result = await invoke(provider);
      attempts.push(result);
      if (result.ok && result.content) {
        return { mode, status: "completed", selected: provider, results: attempts };
      }
    }
    return { mode, status: "failed", selected: null, results: attempts };
  }

  const results = await Promise.all(providers.map(invoke));
  const successful = results.filter((item) => item.ok && item.content);
  if (mode === "parallel") {
    return { mode, status: successful.length ? "completed" : "failed", selected: null, results };
  }

  const groups = new Map();
  for (const result of successful) {
    const key = normalize(result.content);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(result);
  }
  const winner = [...groups.values()].sort((a, b) => b.length - a.length)[0];
  const hasMajority = winner && winner.length > providers.length / 2;
  return {
    mode,
    status: hasMajority ? "consensus" : "no_consensus",
    selected: hasMajority ? winner[0].provider : null,
    consensus: hasMajority ? winner[0].content : null,
    agreementCount: hasMajority ? winner.length : 0,
    results
  };
}
