// Cliente HTTP para Kong. Maneja access token, refresh automático y logout.

import { extractClaims, isExpired, expiresIn } from "./jwt.js";

const LS_KEYS = {
  access: "gw_access_token",
  refresh: "gw_refresh_token",
  username: "gw_last_username",
  base: "gw_base_url",
  theme: "gw_theme",
};

function lsGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}
function lsDel(key) {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

export const store = {
  get baseUrl() { return lsGet(LS_KEYS.base) || "http://localhost:8000"; },
  set baseUrl(v) { lsSet(LS_KEYS.base, v); },
  get accessToken() { return lsGet(LS_KEYS.access); },
  set accessToken(v) { lsSet(LS_KEYS.access, v); },
  get refreshToken() { return lsGet(LS_KEYS.refresh); },
  set refreshToken(v) { lsSet(LS_KEYS.refresh, v); },
  get lastUsername() { return lsGet(LS_KEYS.username); },
  set lastUsername(v) { if (v) lsSet(LS_KEYS.username, v); },
  get claims() { return extractClaims(this.accessToken); },
  get isAuthenticated() {
    const t = this.accessToken;
    if (!t) return false;
    const p = extractClaims(t);
    if (!p) return false;
    return !isExpired(p, 0);
  },
  get willExpireSoon() {
    const p = extractClaims(this.accessToken);
    if (!p) return false;
    const s = expiresIn(p);
    return s !== null && s <= 60;
  },
  clear() {
    lsDel(LS_KEYS.access);
    lsDel(LS_KEYS.refresh);
  },
};

// Listeners para que la UI reaccione a cambios de sesión.
const listeners = new Set();
export function onSessionChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit() { listeners.forEach((fn) => fn()); }

export function setSession(access, refresh) {
  store.accessToken = access;
  if (refresh) store.refreshToken = refresh;
  const claims = extractClaims(access);
  if (claims?.username) store.lastUsername = claims.username;
  emit();
}

export function clearSession() {
  store.clear();
  emit();
}

let refreshingPromise = null;

async function doRefresh() {
  if (refreshingPromise) return refreshingPromise;
  const refresh = store.refreshToken;
  if (!refresh) throw new ApiError(401, "No hay refresh token. Inicia sesión de nuevo.");
  refreshingPromise = (async () => {
    try {
      const res = await rawRequest("POST", "/api/v1/auth/refresh", { refreshToken: refresh }, null);
      if (!res.ok) throw new ApiError(res.status, "Refresh inválido o expirado.", res.body);
      const body = typeof res.body === "string" ? JSON.parse(res.body) : res.body;
      setSession(body.accessToken, body.refreshToken);
      return body.accessToken;
    } finally {
      refreshingPromise = null;
    }
  })();
  return refreshingPromise;
}

export class ApiError extends Error {
  constructor(status, message, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

// Petición cruda sin lógica de sesión. Devuelve { ok, status, body, headers, ms }.
async function rawRequest(method, path, body, accessToken) {
  const url = joinUrl(store.baseUrl, path);
  const headers = { "Accept": "application/json" };
  if (body !== null && body !== undefined) headers["Content-Type"] = "application/json";
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  const start = performance.now();
  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== null && body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    const ms = Math.round(performance.now() - start);
    throw new ApiError(0, `No se pudo conectar a ${url}. ¿Está Kong corriendo?`, { error: String(e) });
  }
  const ms = Math.round(performance.now() - start);
  const text = await res.text();
  let parsed = text;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json") && text) {
    try { parsed = JSON.parse(text); } catch { /* keep text */ }
  } else if (!text) {
    parsed = "";
  }
  const headersObj = {};
  res.headers.forEach((v, k) => { headersObj[k] = v; });
  return { ok: res.ok, status: res.status, body: parsed, headers: headersObj, ms };
}

// Petición con manejo de sesión: si recibe 401 y hay refresh, intenta renovar y reintenta una vez.
export async function request(method, path, { body, auth = true, retry = true } = {}) {
  let accessToken = auth ? store.accessToken : null;
  if (auth && accessToken) {
    const p = extractClaims(accessToken);
    if (p && isExpired(p, 5)) {
      try { accessToken = await doRefresh(); }
      catch (e) { clearSession(); throw e; }
    }
  }
  let res = await rawRequest(method, path, body, accessToken);
  if (res.status === 401 && auth && retry && store.refreshToken) {
    try {
      accessToken = await doRefresh();
      res = await rawRequest(method, path, body, accessToken);
    } catch (e) {
      clearSession();
      throw e;
    }
  }
  return res;
}

function joinUrl(base, path) {
  if (!path) return base;
  if (path.startsWith("http")) return path;
  return base.replace(/\/+$/, "") + (path.startsWith("/") ? path : "/" + path);
}

// Llamada directa de autenticación (no usa el access token, pero guarda la sesión).
export async function authLogin(username, password) {
  const res = await rawRequest("POST", "/api/v1/auth/login", { username, password }, null);
  if (res.ok) {
    const b = typeof res.body === "string" ? JSON.parse(res.body) : res.body;
    setSession(b.accessToken, b.refreshToken);
  }
  return res;
}

export async function authRegister(payload) {
  const res = await rawRequest("POST", "/api/v1/auth/register", payload, null);
  if (res.ok) {
    const b = typeof res.body === "string" ? JSON.parse(res.body) : res.body;
    if (b.accessToken) setSession(b.accessToken, b.refreshToken);
  }
  return res;
}

export async function authRefresh(refreshToken) {
  const res = await rawRequest("POST", "/api/v1/auth/refresh", { refreshToken }, null);
  if (res.ok) {
    const b = typeof res.body === "string" ? JSON.parse(res.body) : res.body;
    setSession(b.accessToken, b.refreshToken);
  }
  return res;
}

export async function authLogout(refreshToken) {
  const res = await rawRequest("POST", "/api/v1/auth/logout", { refreshToken }, null);
  clearSession();
  return res;
}

export async function authMe() {
  return request("GET", "/api/v1/auth/me", { auth: true, retry: false });
}

export { LS_KEYS };
