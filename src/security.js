import { timingSafeEqual } from "node:crypto";

export function constantTimeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isAuthorized(request, configuredKey) {
  if (!configuredKey || configuredKey.length < 32) return false;
  const header = request.headers.authorization ?? "";
  if (!header.startsWith("Bearer ")) return false;
  return constantTimeEqual(header.slice(7), configuredKey);
}

export function parseEnabledProviders(value = "") {
  const allowed = new Set(["openai", "deepseek", "gemini"]);
  return new Set(value.split(",").map((item) => item.trim().toLowerCase()).filter((item) => allowed.has(item)));
}

export function createRateLimiter(limit = 60, windowMs = 60_000) {
  const buckets = new Map();
  return function allow(key, now = Date.now()) {
    const current = buckets.get(key);
    if (!current || now - current.startedAt >= windowMs) {
      buckets.set(key, { startedAt: now, count: 1 });
      return true;
    }
    if (current.count >= limit) return false;
    current.count += 1;
    return true;
  };
}
