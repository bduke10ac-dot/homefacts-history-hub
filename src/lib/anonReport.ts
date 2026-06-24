const TOKEN_KEY = "homefacts.anon_token";
const COUNT_KEY = "homefacts.anon_count"; // JSON: { day: "YYYY-MM-DD", count: n }

export const FREE_DAILY_LIMIT = 3;

export function getAnonToken(): string {
  let t = localStorage.getItem(TOKEN_KEY);
  if (!t) {
    t = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
    localStorage.setItem(TOKEN_KEY, t);
  }
  return t;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function readCount(): { day: string; count: number } {
  try {
    const raw = localStorage.getItem(COUNT_KEY);
    if (!raw) return { day: today(), count: 0 };
    const parsed = JSON.parse(raw);
    if (parsed?.day !== today()) return { day: today(), count: 0 };
    return { day: parsed.day, count: Number(parsed.count) || 0 };
  } catch {
    return { day: today(), count: 0 };
  }
}

export function anonReportsUsedToday(): number {
  return readCount().count;
}

export function anonReportsRemaining(): number {
  return Math.max(0, FREE_DAILY_LIMIT - anonReportsUsedToday());
}

export function hasUsedAnonReport(): boolean {
  return anonReportsRemaining() <= 0;
}

export function markAnonReportUsed() {
  const cur = readCount();
  localStorage.setItem(
    COUNT_KEY,
    JSON.stringify({ day: cur.day, count: cur.count + 1 }),
  );
}
