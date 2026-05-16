const UNITS: Record<string, number> = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 604_800_000,
};

/** Parses "10m", "1h30m", "2d", "7d" etc. Returns milliseconds or null on invalid input. */
export function parseDuration(input: string): number | null {
  const regex = /(\d+)\s*([smhdw])/gi;
  let ms = 0;
  let matched = false;
  for (const [, amount, unit] of input.matchAll(regex)) {
    ms += parseInt(amount, 10) * (UNITS[unit.toLowerCase()] ?? 0);
    matched = true;
  }
  return matched && ms > 0 ? ms : null;
}

export function formatDuration(ms: number): string {
  const parts: string[] = [];
  const d = Math.floor(ms / 86_400_000); if (d) parts.push(`${d}d`);
  const h = Math.floor((ms % 86_400_000) / 3_600_000); if (h) parts.push(`${h}h`);
  const m = Math.floor((ms % 3_600_000) / 60_000); if (m) parts.push(`${m}m`);
  const s = Math.floor((ms % 60_000) / 1_000); if (s) parts.push(`${s}s`);
  return parts.join(' ') || '0s';
}
