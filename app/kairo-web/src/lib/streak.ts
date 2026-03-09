/**
 * Calculate current streak — consecutive days with a check-in,
 * starting from today (or yesterday if no check-in today yet).
 */
export function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const normalized = dates.map((d) => {
    const nd = new Date(d);
    nd.setHours(0, 0, 0, 0);
    return nd.getTime();
  });

  const unique = [...new Set(normalized)].sort((a, b) => b - a);
  const oneDay = 24 * 60 * 60 * 1000;
  let streak = 0;

  let cursor = today.getTime();
  if (unique[0] !== cursor) {
    cursor = cursor - oneDay;
    if (unique[0] !== cursor) return 0;
  }

  for (const dateMs of unique) {
    if (dateMs === cursor) {
      streak++;
      cursor -= oneDay;
    } else if (dateMs < cursor) {
      break;
    }
  }

  return streak;
}
