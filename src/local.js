import http from "node:http";
import { handleRequest } from "./handler.js";

const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 8787);
const server = http.createServer(handleRequest);

server.listen(port, host, () => {
  console.info(`FM-001 listening on http://${host}:${port}`);
});
