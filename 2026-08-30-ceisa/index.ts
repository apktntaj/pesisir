import { clientFromEnv } from "./src/env";

const token = await clientFromEnv().auth.login();
console.log(JSON.stringify({
  authenticated: true,
  accessExpiresAt: new Date(token.expiresAt).toISOString(),
  refreshAvailable: !!token.refresh,
}, null, 2));
