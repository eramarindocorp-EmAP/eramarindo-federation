import { handleRequest } from "../src/server.js";

// Vercel Node.js Function adapter. The shared FM-001 handler preserves the
// existing API contract; /api is stripped before route dispatch.
export default async function handler(request, response) {
  return handleRequest(request, response);
}
