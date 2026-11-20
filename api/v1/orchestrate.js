import { handleRequest } from "../../src/handler.js";

// Pin orchestration to an explicit Vercel function route.
export default async function handler(request, response) {
  const url = new URL(request.url || "/", "http://localhost");
  request.url = "/api/v1/orchestrate" + url.search;
  return handleRequest(request, response);
}
