import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { AccessibilityInfo, Animated, StyleSheet } from 'react-native';
import {
  CalendarActivityFeedback,
  CalendarMonthActivity,
} from './CalendarActivityFeedback';
import { palettes as mockPalettes } from '../../constants/theme/tokens';

jest.mock('../../providers/ThemeProvider/ThemeProvider', () => ({
  useAppTheme: () => ({ colors: mockPalettes.light }),
}));
let app: Renderer.ReactTestRenderer;
beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(async () => {
  await act(async () => app?.unmount());
  jest.restoreAllMocks();
  jest.useRealTimers();
});

test('progress delays 200ms, reserves identical geometry, resets on new query and cancels on close', async () => {
  const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
  const timeout = jest.spyOn(global, 'setTimeout');
  const cancel = jest.spyOn(global, 'clearTimeout');
  const motion = { reduced: true, active: true };
  let status: 'loading' | 'ready' | 'error' = 'loading';
  let requestKey = 'a';
  const render = () => (
    <CalendarActivityFeedback
      status={status}
      requestKey={requestKey}
      message="Loading"
      motion={motion}
    />
  );
  await act(async () => {
    app = Renderer.create(render());
  });
  const segment = () =>
    StyleSheet.flatten(
      app.root.findAllByProps({ testID: 'calendar-progress-segment' })[0].props
        .style,
    );
  const track = () =>
    StyleSheet.flatten(
      app.root.findAllByProps({ testID: 'calendar-progress-track' })[0].props
        .style,
    );
  expect(track().height).toBe(2);
  await act(async () => {
    jest.advanceTimersByTime(199);
  });
  expect(segment().opacity).toBe(0);
  await act(async () => {
    jest.advanceTimersByTime(1);
  });
  expect(segment().opacity).toBe(1);
  expect(announce).toHaveBeenCalledTimes(1);
  requestKey = 'b';
  await act(async () => {
    app.update(render());
  });
  expect(segment().opacity).toBe(0);
  status = 'ready';
  await act(async () => {
    app.update(render());
    jest.advanceTimersByTime(200);
  });
  expect(segment().opacity).toBe(0);
  status = 'error';
  await act(async () => {
    app.update(render());
  });
  expect(track().height).toBe(2);
  expect(announce).toHaveBeenCalledTimes(2);
  status = 'loading';
  requestKey = 'closing';
  await act(async () => {
    app.update(render());
  });
  const pending = timeout.mock.calls
    .map((call, index) => (call[1] === 200 ? index : -1))
    .filter(index => index >= 0)
    .pop()!;
  const handle = timeout.mock.results[pending].value;
  await act(async () => {
    app.unmount();
  });
  expect(cancel).toHaveBeenCalledWith(handle);
});

test('paging shows progress immediately and continues until month data is ready', async () => {
  let paging = true;
  let status: 'loading' | 'ready' = 'ready';
  const render = () => (
    <CalendarActivityFeedback
      paging={paging}
      status={status}
      requestKey="month"
      message="Loading"
      motion={{ reduced: true, active: true }}
    />
  );
  const opacity = () =>
    StyleSheet.flatten(
      app.root.findAllByProps({ testID: 'calendar-progress-segment' })[0].props
        .style,
    ).opacity;
  await act(async () => {
    app = Renderer.create(render());
  });
  expect(opacity()).toBe(1);
  status = 'loading';
  await act(async () => {
    app.update(render());
  });
  paging = false;
  await act(async () => {
    app.update(render());
  });
  expect(opacity()).toBe(1);
  status = 'ready';
  await act(async () => {
    app.update(render());
  });
  expect(opacity()).toBe(0);
  paging = true;
  await act(async () => {
    app.update(render());
  });
  paging = false;
  await act(async () => {
    app.update(render());
  });
  expect(opacity()).toBe(0);
});

test('animations stop in background and Reduce Motion keeps a static indicator', async () => {
  const stop = jest.fn();
  const loop = jest
    .spyOn(Animated, 'loop')
    .mockReturnValue({ start: jest.fn(), stop, reset: jest.fn() });
  let motion = { reduced: false, active: true };
  const render = () => (
    <CalendarActivityFeedback
      status="loading"
      requestKey="a"
      message="Loading"
      motion={motion}
    />
  );
  await act(async () => {
    app = Renderer.create(render());
  });
  await act(async () => {
    jest.advanceTimersByTime(200);
  });
  expect(loop).toHaveBeenCalledTimes(1);
  motion = { reduced: false, active: false };
  await act(async () => {
    app.update(render());
  });
  expect(stop).toHaveBeenCalledTimes(1);
  motion = { reduced: true, active: true };
  await act(async () => {
    app.update(render());
  });
  expect(loop).toHaveBeenCalledTimes(1);
});

test('cached highlights are immediately visible and new activity fades without animating text', async () => {
  const timing = jest.spyOn(Animated, 'timing');
  const motion = { reduced: false, active: true };
  await act(async () => {
    app = Renderer.create(<CalendarMonthActivity occupied motion={motion} />);
  });
  const layer = () =>
    StyleSheet.flatten(
      app.root.findAllByProps({ testID: 'calendar-month-activity' })[0].props
        .style,
    );
  expect(layer().opacity.__getValue()).toBe(1);
  await act(async () => {
    app.update(<CalendarMonthActivity occupied={false} motion={motion} />);
  });
  expect(layer().opacity.__getValue()).toBe(0);
  await act(async () => {
    app.update(<CalendarMonthActivity occupied motion={motion} />);
  });
  expect(timing).toHaveBeenLastCalledWith(
    expect.anything(),
    expect.objectContaining({
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }),
  );
});
