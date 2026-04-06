export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function estimatedDuration(text: string): string {
  // Average speaking pace: ~130 words/minute
  const words = wordCount(text);
  const seconds = Math.round((words / 130) * 60);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `~${s}s`;
  return s === 0 ? `~${m}m` : `~${m}m ${s}s`;
}
