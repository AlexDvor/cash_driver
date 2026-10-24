import { resolveHeadingSwipe } from './calendarGestures';

test.each([
  [-200, 0, 500, 700, false, 1],
  [200, 0, 500, 700, false, -1],
  [-50, 0, 65, 700, false, 1],
  [-50, 0, 600, 700, false, null],
  [-10, 0, 10, 700, false, null],
  [-200, 170, 100, 700, false, null],
  [-200, 0, 100, 700, true, null],
  [-200, 0, 100, 0, false, null],
  [200, 0, 100, 700, false, -1],
] as const)(
  'heading swipe dx=%i dy=%i elapsed=%i width=%i multitouch=%s resolves %s',
  (dx, dy, elapsed, width, multi, expected) => {
    expect(resolveHeadingSwipe(dx, dy, elapsed, width, multi)).toBe(expected);
  },
);
