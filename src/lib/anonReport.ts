const TOKEN_KEY = "homefacts.anon_token";
const USED_KEY = "homefacts.anon_used";

export function getAnonToken(): string {
  let t = localStorage.getItem(TOKEN_KEY);
  if (!t) {
    t = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
    localStorage.setItem(TOKEN_KEY, t);
  }
  return t;
}

export function hasUsedAnonReport(): boolean {
  return localStorage.getItem(USED_KEY) === "1";
}

export function markAnonReportUsed() {
  localStorage.setItem(USED_KEY, "1");
}
