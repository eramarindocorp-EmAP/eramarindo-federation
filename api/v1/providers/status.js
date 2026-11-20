import { handleRequest } from "../../../src/handler.js";

// Pin provider status to an explicit route instead of relying only on catch-all routing.
export default async function handler(request, response) {
  const url = new URL(request.url || "/", "http://localhost");
  request.url = "/api/v1/providers/status" + url.search;
  return handleRequest(request, response);
}
