import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { repositoryRoot } from "./real-route-profile.mjs";

export class CredentialHandle {
  #credential;
  constructor(routeType, credential) {
    assert.ok(["PROCESS_ENVIRONMENT", "DOTENV_FILE"].includes(routeType));
    this.routeType = routeType;
    this.present = typeof credential === "string" && credential.length > 0;
    this.#credential = this.present ? credential : null;
    Object.freeze(this);
  }
  async withCredential(callback) {
    assert.equal(this.present, true, "approved credential is unavailable");
    return callback(this.#credential);
  }
  toJSON() { return { routeType: this.routeType, present: this.present }; }
}

function parseDotenvValue(text, name) {
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match || match[1] !== name) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    return value;
  }
  return null;
}

export async function resolveApprovedCredential({ environment = process.env, dotenvPath = path.join(repositoryRoot, ".env") } = {}) {
  if (typeof environment.OPENAI_API_KEY === "string" && environment.OPENAI_API_KEY.length > 0) return new CredentialHandle("PROCESS_ENVIRONMENT", environment.OPENAI_API_KEY);
  let text;
  try { text = await readFile(dotenvPath, "utf8"); } catch (error) { if (error?.code === "ENOENT") return new CredentialHandle("DOTENV_FILE", null); throw error; }
  return new CredentialHandle("DOTENV_FILE", parseDotenvValue(text, "OPENAI_API_KEY"));
}
