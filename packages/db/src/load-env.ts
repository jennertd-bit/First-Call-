import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Walk up from this file to find the repo-root .env and load it. Keeps
// drizzle-kit + the seed script working regardless of process cwd, with no
// extra dependency (uses Node's built-in process.loadEnvFile).
let dir = dirname(fileURLToPath(import.meta.url));
for (let i = 0; i < 6; i++) {
  const candidate = join(dir, ".env");
  if (existsSync(candidate)) {
    process.loadEnvFile(candidate);
    break;
  }
  dir = dirname(dir);
}
