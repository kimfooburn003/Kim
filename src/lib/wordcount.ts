export function formatWordCount(value?: number | null): string {
  if (value == null || !Number.isFinite(value)) return 'Unknown';
  return new Intl.NumberFormat('en-US').format(value);
}
