// Logical pixels (dp): claim only deliberate, predominantly horizontal drags.
export const calendarGestures = {
  claimDistance: 8,
  pageFraction: 0.25,
  flingVelocity: 0.5,
  flingDistance: 12,
  horizontalDominance: 1.3,
  slowSnapFallbackMs: 350,
  scrollThrottleMs: 32,
} as const;

export function resolveHeadingSwipe(
  dx: number,
  dy: number,
  elapsedMs: number,
  pageWidth: number,
  multiTouch: boolean,
): -1 | 1 | null {
  const distance = Math.abs(dx);
  if (
    multiTouch ||
    pageWidth <= 0 ||
    distance < calendarGestures.claimDistance ||
    distance <= Math.abs(dy) * calendarGestures.horizontalDominance
  )
    return null;
  const complete =
    distance >= pageWidth * calendarGestures.pageFraction ||
    (distance >= calendarGestures.flingDistance &&
      distance / Math.max(1, elapsedMs) >= calendarGestures.flingVelocity);
  return complete ? (dx < 0 ? 1 : -1) : null;
}
