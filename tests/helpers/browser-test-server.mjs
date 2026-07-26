import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const helperDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(helperDirectory, "..", "..");
const publicRoot = path.resolve(repositoryRoot, "public");
const host = process.env.PLAYWRIGHT_TEST_HOST || "127.0.0.1";
const port = Number(process.env.PLAYWRIGHT_TEST_PORT || 4177);

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".webp", "image/webp"]
]);

function sendText(response, statusCode, message) {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": "text/plain; charset=utf-8",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(message);
}

function resolvePublicPath(rawUrl = "/") {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(rawUrl, `http://${host}:${port}`).pathname);
  } catch {
    return null;
  }

  if (pathname === "/") pathname = "/index.html";
  if (pathname.includes("\0")) return null;

  const relativePath = pathname.replace(/^\/+/, "");
  const resolved = path.resolve(publicRoot, relativePath);
  const withinPublic = resolved === publicRoot || resolved.startsWith(`${publicRoot}${path.sep}`);
  return withinPublic ? resolved : null;
}

const server = http.createServer((request, response) => {
  if (!["GET", "HEAD"].includes(request.method || "")) {
    sendText(response, 405, "Method not allowed");
    return;
  }

  if (request.url === "/__browser_test_shutdown__") {
    sendText(response, 200, "Browser test server shutting down");
    setImmediate(() => closeServer(0));
    return;
  }

  const filePath = resolvePublicPath(request.url);
  if (!filePath) {
    sendText(response, 400, "Invalid public path");
    return;
  }

  let stats;
  try {
    stats = fs.statSync(filePath);
  } catch {
    sendText(response, 404, "Public asset not found");
    return;
  }

  if (!stats.isFile()) {
    sendText(response, 404, "Public asset not found");
    return;
  }

  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Length": stats.size,
    "Content-Type": contentTypes.get(path.extname(filePath).toLowerCase()) || "application/octet-stream",
    "X-Content-Type-Options": "nosniff"
  });
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  fs.createReadStream(filePath).pipe(response);
});

let closing = false;
function closeServer(exitCode = 0) {
  if (closing) return;
  closing = true;
  server.close(() => process.exit(exitCode));
  setTimeout(() => process.exit(exitCode || 1), 3_000).unref();
}

server.on("error", (error) => {
  console.error(`BROWSER_TEST_SERVER_ERROR ${error.message}`);
  process.exit(1);
});

server.listen(port, host, () => {
  console.log(`BROWSER_TEST_SERVER_READY http://${host}:${port}/`);
});

process.on("SIGINT", () => closeServer(0));
process.on("SIGTERM", () => closeServer(0));
