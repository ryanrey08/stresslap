// Copies the MediaPipe WASM runtime into /public so face detection runs
// entirely from this app's own origin (no CDN, no photo ever leaves the browser).
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules", "@mediapipe", "tasks-vision", "wasm");
const dest = join(root, "public", "mediapipe", "wasm");

if (!existsSync(src)) {
  console.warn("[stresslap] @mediapipe/tasks-vision not installed yet; skipping wasm copy.");
  process.exit(0);
}
mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log("[stresslap] MediaPipe wasm copied to public/mediapipe/wasm");
