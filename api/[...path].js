import { handleRequest } from "../src/handler.js";

// Vercel Node.js Function entrypoint. Keep the default export here only;
// application logic lives in src/handler.js and is not a function entrypoint.
export default async function handler(request, response) {
  return handleRequest(request, response);
}
