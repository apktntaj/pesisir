import { CeisaClient } from "./ceisa";

export function clientFromEnv(): CeisaClient {
  const baseUrl = required("CEISA_API_URL");
  const username = required("CEISA_USERNAME");
  const password = required("CEISA_PASSWORD");
  const header = Bun.env.CEISA_AUTH_HEADER;
  if (header && header !== "Authorization" && header !== "Authentication")
    throw new Error("CEISA_AUTH_HEADER must be Authorization or Authentication");
  const referenceHeader = Bun.env.CEISA_REFERENCE_AUTH_HEADER;
  if (referenceHeader && referenceHeader !== "Authorization" && referenceHeader !== "Authentication")
    throw new Error("CEISA_REFERENCE_AUTH_HEADER must be Authorization or Authentication");
  return new CeisaClient({
    baseUrl, username, password,
    apiKey: Bun.env.CEISA_API_KEY,
    origin: Bun.env.CEISA_ORIGIN,
    authHeader: header === "Authentication" ? "Authentication" : "Authorization",
    referenceAuthHeader: referenceHeader === "Authentication" ? "Authentication" : referenceHeader === "Authorization" ? "Authorization" : undefined,
  });
}

function required(name: string): string {
  const value = Bun.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}
