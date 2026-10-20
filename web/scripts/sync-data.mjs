// Copy the published dataset (../data/<country>/) into public/data/ so the dashboards serve the
// files the export last wrote, never a stale copy. public/data/ is ignored by git.
import { cpSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dst = resolve(here, "../public/data");
rmSync(dst, { recursive: true, force: true });
cpSync(resolve(here, "../../data"), dst, { recursive: true });
console.log("data synced");
