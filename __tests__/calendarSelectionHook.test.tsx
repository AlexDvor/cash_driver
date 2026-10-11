import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { useCalendarSelection } from '../src/hooks/summary/useCalendarSelection';

test('automatic rollover, isolated selection, cancel, day and timezone preserve coordinates', async () => {
  let clock = {
    now: new Date('2026-10-31T23:30:00Z'),
    dayKey: '2026-10-31',
    timeZone: 'UTC',
  };
  let first: ReturnType<typeof useCalendarSelection>;
  let second: ReturnType<typeof useCalendarSelection>;
  function Probe() {
    first = useCalendarSelection(clock);
    second = useCalendarSelection(clock);
    return null;
  }
  let renderer: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(<Probe />);
  });
  expect(first!.month).toEqual({ year: 2026, month: 10 });
  const initialBounds = first!.bounds;
  clock = { ...clock, now: new Date('2026-10-31T23:30:01Z') };
  await act(async () => {
    renderer!.update(<Probe />);
  });
  expect(first!.bounds).toBe(initialBounds);
  await act(async () => {
    first!.openCalendar();
  });
  await act(async () => {
    first!.browseMonth({ year: 2020, month: 2 });
  });
  expect(first!.month.month).toBe(10);
  await act(async () => {
    first!.cancelCalendar();
  });
  expect(first!.draftMonth).toBeNull();
  clock = {
    now: new Date('2026-11-01T01:00:00Z'),
    dayKey: '2026-11-01',
    timeZone: 'UTC',
  };
  await act(async () => {
    renderer!.update(<Probe />);
  });
  expect(first!.month.month).toBe(11);
  await act(async () => {
    first!.applyDay({ year: 2020, month: 2, day: 29 });
  });
  expect(second!.selection.kind).toBe('automatic');
  const utcStart = first!.bounds.start.getTime();
  clock = { ...clock, timeZone: 'America/New_York' };
  await act(async () => {
    renderer!.update(<Probe />);
  });
  expect(first!.selection).toEqual({
    kind: 'day',
    month: { year: 2020, month: 2 },
    date: { year: 2020, month: 2, day: 29 },
  });
  expect(first!.bounds.start.getTime()).not.toBe(utcStart);
  await act(async () => {
    first!.returnToMonth();
  });
  expect(first!.selection.kind).toBe('month');
  await act(async () => {
    first!.moveMonth(-2);
  });
  expect(first!.month).toEqual({ year: 2019, month: 12 });
  await act(async () => {
    renderer!.unmount();
  });
});
