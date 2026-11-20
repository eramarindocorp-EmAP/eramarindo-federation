import { handleRequest } from "../src/handler.js";

// Pin the health check to an explicit Vercel function route.
export default async function handler(request, response) {
  const url = new URL(request.url || "/", "http://localhost");
  request.url = "/api/health" + url.search;
  return handleRequest(request, response);
}
