// Decodificación y análisis de JWT RS256 (sin verificar firma, sólo para inspección).

export function decodeJwt(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const decode = (s) => {
      const normalized = s.replace(/-/g, "+").replace(/_/g, "/");
      const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
      const json = atob(padded);
      return JSON.parse(decodeURIComponent(escape(json)));
    };
    const header = decode(parts[0]);
    const payload = decode(parts[1]);
    const signature = parts[2] ?? "";
    return { header, payload, signature, parts };
  } catch (e) {
    return null;
  }
}

export function extractClaims(token) {
  const decoded = decodeJwt(token);
  if (!decoded) return null;
  return decoded.payload;
}

export function isExpired(payload, skewSeconds = 0) {
  if (!payload || !payload.exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return now + skewSeconds >= payload.exp;
}

export function expiresIn(payload) {
  if (!payload || !payload.exp) return null;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp - now;
}

export function formatExpiresIn(payload) {
  const s = expiresIn(payload);
  if (s === null) return "—";
  if (s <= 0) return "expirado";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export function prettyClaims(payload) {
  if (!payload) return "";
  const lines = Object.entries(payload).map(([k, v]) => {
    const value = typeof v === "object" ? JSON.stringify(v) : String(v);
    return `${k.padEnd(10)} : ${value}`;
  });
  return lines.join("\n");
}
