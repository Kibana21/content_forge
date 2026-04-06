export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatTimeRange(start: number, end: number): string {
  return `${formatDuration(start)} – ${formatDuration(end)}`;
}

export function scenesToDurationLabel(duration: number | null): string {
  const map: Record<number, string> = { 15: "15s", 30: "30s", 60: "1m", 90: "1m 30s" };
  return duration ? (map[duration] || `${duration}s`) : "—";
}
