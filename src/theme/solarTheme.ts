import { getTimes } from 'suncalc';
import type { EffectiveTheme } from './resolveTheme';

export interface SolarCoordinates {
  latitude: number;
  longitude: number;
}

export interface SolarTheme {
  appearance: EffectiveTheme;
  nextChangeAt: number | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function validSolarCoordinates(value: SolarCoordinates): boolean {
  return (
    Number.isFinite(value.latitude) &&
    Math.abs(value.latitude) <= 90 &&
    Number.isFinite(value.longitude) &&
    Math.abs(value.longitude) <= 180
  );
}

/** Use absolute solar events, independent of the device's locale/time zone. */
export function calculateSolarTheme(
  now: number,
  coordinates: SolarCoordinates,
): SolarTheme | null {
  if (!Number.isFinite(now) || !validSolarCoordinates(coordinates)) return null;
  const { latitude, longitude } = coordinates;
  const events: { at: number; appearance: EffectiveTheme }[] = [];
  for (const offset of [-2, -1, 0, 1, 2]) {
    const times = getTimes(
      new Date(now + offset * DAY_MS),
      latitude,
      longitude,
    );
    if (times.sunrise && Number.isFinite(times.sunrise.getTime())) {
      events.push({ at: times.sunrise.getTime(), appearance: 'light' });
    }
    if (times.sunset && Number.isFinite(times.sunset.getTime())) {
      events.push({ at: times.sunset.getTime(), appearance: 'dark' });
    }
  }
  events.sort((a, b) => a.at - b.at);
  const previous = events.filter(event => event.at <= now).at(-1);
  const next = events.find(event => event.at > now);
  if (previous)
    return { appearance: previous.appearance, nextChangeAt: next?.at ?? null };
  const today = getTimes(new Date(now), latitude, longitude);
  if (today.alwaysUp || today.alwaysDown) {
    return {
      appearance: today.alwaysUp ? 'light' : 'dark',
      nextChangeAt: next?.at ?? null,
    };
  }
  return null;
}
