import { getDocumentSchema, validateDocument, type DocumentKind, type ValidationIssue } from "./schemas";

export type AuthHeader = "Authorization" | "Authentication";
export type CeisaOptions = {
  baseUrl: string;
  username: string;
  password: string;
  apiKey?: string;
  origin?: string;
  authHeader?: AuthHeader;
  referenceAuthHeader?: AuthHeader;
  fetch?: typeof globalThis.fetch;
};

export class CeisaError extends Error {
  constructor(public readonly operation: string, public readonly status: number, message: string) {
    super(`${operation}: HTTP ${status}${message ? ` (${message})` : ""}`);
    this.name = "CeisaError";
  }
}

type Token = { access: string; refresh?: string; expiresAt: number; refreshExpiresAt?: number };
type Json = Record<string, unknown>;

export class CeisaClient {
  private readonly baseUrl: string;
  private readonly requestFetch: typeof globalThis.fetch;
  private readonly authHeader: AuthHeader;
  private token?: Token;
  private tokenPromise?: Promise<Token>;

  constructor(private readonly options: CeisaOptions) {
    if (!options.baseUrl || !options.username || !options.password) {
      throw new Error("baseUrl, username, and password are required");
    }
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.requestFetch = options.fetch ?? globalThis.fetch;
    this.authHeader = options.authHeader ?? "Authorization";
  }

  readonly auth = {
    login: () => this.obtainToken(false),
    refresh: () => this.obtainToken(true),
  };

  readonly referensi = {
    kurs: (kodeValuta: string, tanggal?: string) => this.json("kurs", `/openapi/kurs/${part(kodeValuta)}`, { tanggal }),
    lartas: (kodeHs: string) => this.json("lartas", "/openapi/hs-lartas", { kodeHs }),
    tarifHs: (kodeHs: string, tanggal: string) => this.json("tarifHs", "/openapi/tarif-hs", { kodeHs, tanggal }),
    manifesBc11: (params: { noHostBl: string; tglHostBl: string; kodeKantor: string; nama: string }) =>
      this.json("manifesBc11", "/openapi/manifes-bc11", params),
    pelabuhanCari: (kata: string) => this.json("pelabuhanCari", `/openapi/pelabuhan/kata/${part(kata)}`),
    gudangTps: (kodeKantor: string) => this.json("gudangTps", `/openapi/gudangTPS/kodeKantor/${part(kodeKantor)}`),
    pelabuhanKantor: (kodeKantor: string) => this.json("pelabuhanKantor", `/openapi/pelabuhan/kodeKantor/${part(kodeKantor)}`),
  };

  readonly dokumen = {
    detail: (jenisDokumen: "23" | "27", nomorAju: string, kodeKantor: string) =>
      this.json("dokumen.detail", `/openapi/document/detail/${part(jenisDokumen)}/${part(nomorAju)}/${part(kodeKantor)}`),
    schema: (jenis: DocumentKind) => getDocumentSchema(jenis),
    validate: (jenis: DocumentKind, payload: unknown) => validateDocument(jenis, payload),
    kirim: async (jenis: DocumentKind, payload: unknown, settings: { isFinal?: boolean; isRevision?: boolean; validate?: boolean } = {}) => {
      if (settings.isRevision !== undefined && jenis !== "ekspor-bc30" && !jenis.startsWith("tpb-"))
        throw new Error("isRevision is documented only for BC 3.0 and TPB documents");
      if (settings.validate !== false) {
        const issues = await validateDocument(jenis, payload);
        if (issues.length) throw new DocumentValidationError(jenis, issues);
      }
      return this.json("dokumen.kirim", "/openapi/document", {
        isFinal: String(settings.isFinal ?? false),
        isRevision: settings.isRevision === undefined ? undefined : String(settings.isRevision),
      }, { method: "POST", body: JSON.stringify(payload) });
    },
  };

  readonly respon = {
    statusPerusahaan: (idPerusahaan: string) => this.json("statusPerusahaan", "/openapi/status", { idPerusahaan }),
    statusAju: (nomorAju: string) => this.json("statusAju", `/openapi/status/${part(nomorAju)}`),
    download: (path: string) => this.binary("downloadRespon", "/openapi/download-respon", { path }),
    billing: (kodeBilling: string) => this.binary("billing", "/openapi/respon/billing", { kodeBilling }),
    cetakFormulir: (nomorAju: string) => this.binary("cetakFormulir", "/openapi/respon/cetak-formulir", { nomorAju }),
  };

  private async json(operation: string, path: string, query?: Record<string, string | undefined>, init?: RequestInit): Promise<unknown> {
    const response = await this.request(operation, path, query, init);
    const body = await response.text();
    if (!body) return null;
    try { return JSON.parse(body); }
    catch { throw new Error(`${operation}: expected JSON response`); }
  }

  private async binary(operation: string, path: string, query?: Record<string, string | undefined>) {
    const response = await this.request(operation, path, query);
    return { bytes: new Uint8Array(await response.arrayBuffer()), contentType: response.headers.get("content-type") };
  }

  private async request(operation: string, path: string, query?: Record<string, string | undefined>, init?: RequestInit): Promise<Response> {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries(query ?? {})) if (value !== undefined) url.searchParams.set(key, value);
    const token = await this.obtainToken(false);
    const headers = this.headers(token.access, !!init?.body, operation);
    const response = await this.requestFetch(url, { ...init, headers });
    if (!response.ok) throw new CeisaError(operation, response.status, await safeMessage(response));
    return response;
  }

  private headers(access: string, hasBody: boolean, operation: string): Headers {
    const headers = new Headers({ Accept: "application/json" });
    const referenceAuth = ["kurs", "lartas", "tarifHs", "manifesBc11"].includes(operation);
    const header = referenceAuth ? this.options.referenceAuthHeader ?? this.authHeader : this.authHeader;
    headers.set(header, header === "Authorization" ? `Bearer ${access}` : access);
    if (hasBody) headers.set("Content-Type", "application/json");
    if (this.options.apiKey) headers.set("Beacukai-Api-Key", this.options.apiKey);
    if (this.options.origin) headers.set("Origin", this.options.origin);
    return headers;
  }

  private async obtainToken(forceRefresh: boolean): Promise<Token> {
    if (!forceRefresh && this.token && this.token.expiresAt > Date.now() + 30_000) return this.token;
    if (this.tokenPromise) return this.tokenPromise;
    this.tokenPromise = this.issueToken(forceRefresh).finally(() => { this.tokenPromise = undefined; });
    return this.tokenPromise;
  }

  private async issueToken(forceRefresh: boolean): Promise<Token> {
    const canRefresh = !!this.token?.refresh && !!this.token.refreshExpiresAt && this.token.refreshExpiresAt > Date.now() + 30_000;
    if (canRefresh) {
      try {
        const response = await this.requestFetch(`${this.baseUrl}/nle-oauth/v1/user/update-token`, {
          method: "POST", headers: { Authorization: this.token!.refresh! },
        });
        if (response.ok) return this.storeToken(await parseJson(response, "refresh"), this.token?.refresh);
        if (forceRefresh) throw new CeisaError("refresh", response.status, await safeMessage(response));
      } catch (error) { if (forceRefresh) throw error; }
    }
    if (forceRefresh && !canRefresh) throw new Error("No valid refresh token available");
    const response = await this.requestFetch(`${this.baseUrl}/nle-oauth/v1/user/login`, {
      method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ username: this.options.username, password: this.options.password }),
    });
    if (!response.ok) throw new CeisaError("login", response.status, await safeMessage(response));
    return this.storeToken(await parseJson(response, "login"));
  }

  private storeToken(payload: unknown, priorRefresh?: string): Token {
    const access = findString(payload, ["access_token", "accessToken"]);
    if (!access) throw new Error("CEISA auth response has no access token");
    const issuedRefresh = findString(payload, ["refresh_token", "refreshToken"]);
    const refresh = issuedRefresh ?? priorRefresh;
    const expiresIn = findNumber(payload, ["expires_in", "expiresIn"]) ?? 300;
    const refreshExpiresIn = findNumber(payload, ["refresh_expires_in", "refreshExpiresIn"]) ?? 86_400;
    this.token = { access, refresh, expiresAt: Date.now() + expiresIn * 1000,
      refreshExpiresAt: issuedRefresh ? Date.now() + refreshExpiresIn * 1000
        : priorRefresh ? this.token?.refreshExpiresAt : undefined };
    return this.token;
  }
}

export class DocumentValidationError extends Error {
  constructor(public readonly jenis: DocumentKind, public readonly issues: ValidationIssue[]) {
    super(`Invalid ${jenis} document: ${issues.length} issue(s)`);
    this.name = "DocumentValidationError";
  }
}

function part(value: string): string {
  if (!value) throw new Error("Path parameter must not be empty");
  return encodeURIComponent(value);
}

async function parseJson(response: Response, operation: string): Promise<unknown> {
  try { return await response.json(); }
  catch { throw new Error(`${operation}: expected JSON response`); }
}

async function safeMessage(response: Response): Promise<string> {
  try {
    const payload = await response.json() as Json;
    return typeof payload.message === "string" ? payload.message.slice(0, 200) : "";
  } catch { return ""; }
}

function findValue(payload: unknown, keys: string[]): unknown {
  if (!payload || typeof payload !== "object") return undefined;
  const record = payload as Json;
  for (const key of keys) if (record[key] !== undefined) return record[key];
  for (const value of Object.values(record)) {
    if (value && typeof value === "object") {
      const found = findValue(value, keys);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

function findString(payload: unknown, keys: string[]): string | undefined {
  const value = findValue(payload, keys);
  return typeof value === "string" && value.length ? value : undefined;
}

function findNumber(payload: unknown, keys: string[]): number | undefined {
  const value = findValue(payload, keys);
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(number) && number > 0 ? number : undefined;
}
