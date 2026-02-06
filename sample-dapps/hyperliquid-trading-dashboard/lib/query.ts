export function qs(obj: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    sp.set(k, String(v));
  }
  return sp.toString();
}