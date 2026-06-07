#!/usr/bin/env node
// Boot-time env validator. Exits non-zero if required vars are missing or look wrong.
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadDotEnv() {
  const path = resolve(process.cwd(), ".env");
  if (!existsSync(path)) return {};
  const out = {};
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const env = { ...loadDotEnv(), ...process.env };

const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];
const recommended = ["SUPABASE_SERVICE_ROLE_KEY"];

const missing = required.filter((k) => !env[k]);
if (missing.length) {
  console.error(`\n[check-env] Missing required vars: ${missing.join(", ")}`);
  console.error("           Edit .env (see .env.example) and try again.\n");
  process.exit(1);
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
if (url && !/^https?:\/\//.test(url)) {
  console.error(`\n[check-env] NEXT_PUBLIC_SUPABASE_URL looks wrong: ${url}\n`);
  process.exit(1);
}

if (env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_SERVICE_ROLE_KEY.startsWith("sb_publishable_")) {
  console.error("\n[check-env] SUPABASE_SERVICE_ROLE_KEY is set to the publishable key. Use the service_role key from Supabase -> Project Settings -> API.\n");
  process.exit(1);
}

const warnMissing = recommended.filter((k) => !env[k]);
if (warnMissing.length) {
  console.warn(
    `\n[check-env] Optional vars not set: ${warnMissing.join(", ")}. ` +
      "Admin operations and account self-delete will be disabled until SUPABASE_SERVICE_ROLE_KEY is provided.\n",
  );
}
