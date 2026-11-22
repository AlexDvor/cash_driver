function channels(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

// Opaque blend of `top` over `base` (ratio = share of `top`). Android loses
// rounded corners when a background switches from transparent to colored, so
// translucent fills are pre-mixed into solid colors instead.
export function mixColor(top: string, base: string, ratio: number): string {
  const a = channels(top);
  const b = channels(base);
  const mixed = a.map((channel, index) =>
    Math.round(channel * ratio + b[index] * (1 - ratio)),
  );
  return `#${mixed.map(item => item.toString(16).padStart(2, '0')).join('')}`;
}
