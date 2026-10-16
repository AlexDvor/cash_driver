import React, { useEffect as mockUseEffect } from 'react';
import Renderer, { act } from 'react-test-renderer';
import { AccessibilityInfo, AppState, Keyboard } from 'react-native';
import { useHomePaymentScroll } from './useHomePaymentScroll';

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => void) =>
    mockUseEffect(
      () => (mockFocused ? callback() : undefined),
      [callback, mockFocused],
    ),
}));
let mockFocused = true;

let hook!: ReturnType<typeof useHomePaymentScroll>;
let app: Renderer.ReactTestRenderer;
let props: Parameters<typeof useHomePaymentScroll>[0];
const scrollTo = jest.fn();
const scrollToEnd = jest.fn();
const focusReceived = jest.fn();
const keyboard = new Map<
  string,
  (event: import('react-native').KeyboardEvent) => void
>();
let background!: (state: 'active' | 'background') => void;
const originalState = AppState.currentState;

function Probe() {
  hook = useHomePaymentScroll(props);
  return null;
}

beforeEach(async () => {
  jest.useFakeTimers();
  AppState.currentState = 'active';
  mockFocused = true;
  scrollTo.mockClear();
  scrollToEnd.mockClear();
  focusReceived.mockClear();
  keyboard.clear();
  props = {
    fare: '',
    validFare: false,
    received: '',
    validReceived: false,
    saving: false,
  };
  jest.spyOn(Keyboard, 'isVisible').mockReturnValue(true);
  jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
  jest.spyOn(Keyboard, 'addListener').mockImplementation((name, callback) => {
    keyboard.set(name, callback);
    return { remove: jest.fn() };
  });
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_, callback) => {
    background = callback;
    return { remove: jest.fn() };
  });
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(false);
  await act(async () => {
    app = Renderer.create(<Probe />);
  });
  Object.assign(hook.scrollRef, { current: { scrollTo, scrollToEnd } });
  Object.assign(hook.contentRef, { current: {} });
  Object.assign(hook.fareRef, {
    current: {
      measureLayout: (_target: unknown, done: (x: number, y: number) => void) =>
        done(0, 300),
    },
  });
  Object.assign(hook.receivedRef, {
    current: {
      measureLayout: (_target: unknown, done: (x: number, y: number) => void) =>
        done(0, 500),
    },
  });
  Object.assign(hook.receivedInputRef, { current: { focus: focusReceived } });
});
afterEach(async () => {
  await act(async () => app.unmount());
  AppState.currentState = originalState;
  jest.restoreAllMocks();
  jest.useRealTimers();
});

async function edit(fare = '12', validFare = true) {
  props = { ...props, fare, validFare };
  await act(async () => {
    hook.changedFare();
    app.update(<Probe />);
  });
}

test('focus and keyboard resize smoothly align the whole field; five idle seconds focus received', async () => {
  await act(async () => hook.focus('fare'));
  expect(scrollTo).toHaveBeenLastCalledWith({ y: 304, animated: true });
  scrollTo.mockClear();
  await act(async () =>
    keyboard.get('keyboardDidShow')?.({
      duration: 0,
      easing: 'keyboard',
      endCoordinates: { height: 300, width: 360, screenX: 0, screenY: 500 },
    }),
  );
  expect(scrollTo).toHaveBeenCalledWith({ y: 304, animated: true });
  await edit();
  await act(async () => jest.advanceTimersByTime(4999));
  expect(focusReceived).not.toHaveBeenCalled();
  await edit('123');
  await act(async () => jest.advanceTimersByTime(4999));
  expect(focusReceived).not.toHaveBeenCalled();
  await act(async () => jest.advanceTimersByTime(1));
  expect(focusReceived).toHaveBeenCalledTimes(1);
  await act(async () => hook.focus('received'));
  expect(scrollTo).toHaveBeenLastCalledWith({ y: 504, animated: true });
});

test.each(['', '0', '12,', 'invalid'])(
  'does not advance an incomplete or invalid fare %s',
  async fare => {
    await act(async () => hook.focus('fare'));
    await edit(fare, false);
    await act(async () => jest.advanceTimersByTime(6000));
    expect(focusReceived).not.toHaveBeenCalled();
  },
);

test.each([
  'manual',
  'received',
  'hide',
  'background',
  'saving',
  'filled',
  'unmount',
  'navigation',
])('cancels advance on %s', async reason => {
  await act(async () => hook.focus('fare'));
  await edit();
  await act(async () => {
    if (reason === 'manual') hook.cancel();
    if (reason === 'received') hook.focus('received');
    if (reason === 'hide')
      keyboard.get('keyboardDidHide')?.({
        duration: 0,
        easing: 'keyboard',
        endCoordinates: { height: 0, width: 360, screenX: 0, screenY: 800 },
      });
    if (reason === 'background') background('background');
    if (reason === 'saving' || reason === 'filled') {
      props = {
        ...props,
        saving: reason === 'saving',
        received: reason === 'filled' ? '20' : '',
      };
      app.update(<Probe />);
    }
    if (reason === 'unmount') app.unmount();
    if (reason === 'navigation') {
      mockFocused = false;
      app.update(<Probe />);
    }
  });
  await act(async () => jest.advanceTimersByTime(6000));
  expect(focusReceived).not.toHaveBeenCalled();
});

test('cancel rejects a delayed native measurement', async () => {
  let measure!: (x: number, y: number) => void;
  Object.assign(hook.fareRef, {
    current: {
      measureLayout: (_target: unknown, done: typeof measure) => {
        measure = done;
      },
    },
  });
  await act(async () => hook.focus('fare'));
  hook.cancel();
  measure(0, 300);
  expect(scrollTo).not.toHaveBeenCalled();
});

test.each([
  [800, 250],
  [550, 0],
])(
  'keyboard reserves only actual viewport overlap for viewport height %s',
  async (height, overlap) => {
    Object.assign(hook.scrollRef, {
      current: {
        scrollTo,
        measureInWindow: (
          done: (x: number, y: number, width: number, height: number) => void,
        ) => done(0, 50, 360, height),
      },
    });
    await act(async () => hook.focus('fare'));
    await act(async () =>
      keyboard.get('keyboardDidShow')?.({
        duration: 0,
        easing: 'keyboard',
        endCoordinates: { height: 300, width: 360, screenX: 0, screenY: 600 },
      }),
    );
    expect(hook.keyboardInset).toBe(overlap);
    scrollTo.mockClear();
    await act(async () => hook.contentResized());
    if (overlap > 0)
      expect(scrollTo).toHaveBeenCalledWith({ y: 304, animated: true });
    await act(async () =>
      keyboard.get('keyboardDidHide')?.({
        duration: 0,
        easing: 'keyboard',
        endCoordinates: { height: 0, width: 360, screenX: 0, screenY: 900 },
      }),
    );
    expect(hook.keyboardInset).toBe(0);
  },
);

test('Reduce Motion disables animated scrolling', async () => {
  let preference!: (enabled: boolean) => void;
  await act(async () => app.unmount());
  jest
    .spyOn(AccessibilityInfo, 'addEventListener')
    .mockImplementation((_, callback) => {
      preference = callback as (enabled: boolean) => void;
      return { remove: jest.fn() };
    });
  await act(async () => {
    app = Renderer.create(<Probe />);
  });
  Object.assign(hook.scrollRef, { current: { scrollTo } });
  Object.assign(hook.contentRef, { current: {} });
  Object.assign(hook.fareRef, {
    current: {
      measureLayout: (_target: unknown, done: (x: number, y: number) => void) =>
        done(0, 300),
    },
  });
  preference(true);
  await act(async () => hook.focus('fare'));
  expect(scrollTo).toHaveBeenLastCalledWith({ y: 304, animated: false });
});

async function enterReceived(received = '20', validReceived = true) {
  props = { ...props, received, validReceived };
  await act(async () => {
    hook.changedReceived();
    app.update(<Probe />);
  });
}
function hideKeyboard() {
  keyboard.get('keyboardDidHide')?.({
    duration: 0,
    easing: 'keyboard',
    endCoordinates: { height: 0, width: 360, screenX: 0, screenY: 900 },
  });
}

async function quickReceived() {
  props = { ...props, received: '50', validReceived: true };
  await act(async () => {
    hook.quickReceived();
    app.update(<Probe />);
  });
}

test.each(['fare', 'received'] as const)(
  'quick entry from %s waits two seconds and survives native blur',
  async field => {
    await act(async () => hook.focus(field));
    await quickReceived();
    await act(async () => hook.blur(field));
    await act(async () => jest.advanceTimersByTime(1999));
    expect(Keyboard.dismiss).not.toHaveBeenCalled();
    await act(async () => jest.advanceTimersByTime(1));
    expect(Keyboard.dismiss).toHaveBeenCalledTimes(1);
    await act(async () => hideKeyboard());
    await act(async () => jest.advanceTimersByTime(50));
    expect(scrollToEnd).toHaveBeenCalledTimes(1);
    expect(focusReceived).not.toHaveBeenCalled();
  },
);

test('same quick amount restarts idle timer with keyboard already hidden', async () => {
  await act(async () => hideKeyboard());
  await quickReceived();
  await act(async () => jest.advanceTimersByTime(1500));
  await quickReceived();
  await act(async () => jest.advanceTimersByTime(1999));
  expect(scrollToEnd).not.toHaveBeenCalled();
  await act(async () => jest.advanceTimersByTime(1));
  expect(scrollToEnd).toHaveBeenCalledTimes(1);
  expect(Keyboard.dismiss).not.toHaveBeenCalled();
  expect(focusReceived).not.toHaveBeenCalled();
});

test.each(['touch', 'fare edit', 'hide', 'background'])(
  'quick idle action is cancelled by %s',
  async reason => {
    await quickReceived();
    await act(async () => {
      if (reason === 'touch') hook.cancel();
      if (reason === 'fare edit') hook.changedFare();
      if (reason === 'hide') hideKeyboard();
      if (reason === 'background') background('background');
    });
    await act(async () => jest.advanceTimersByTime(3000));
    expect(Keyboard.dismiss).not.toHaveBeenCalled();
    expect(scrollToEnd).not.toHaveBeenCalled();
  },
);

test('received entry waits two idle seconds, hides keyboard, then scrolls exactly once after blur/layout', async () => {
  await act(async () => hook.focus('received'));
  await enterReceived();
  await act(async () => jest.advanceTimersByTime(1999));
  expect(Keyboard.dismiss).not.toHaveBeenCalled();
  await enterReceived('25');
  await act(async () => jest.advanceTimersByTime(1999));
  expect(Keyboard.dismiss).not.toHaveBeenCalled();
  await act(async () => jest.advanceTimersByTime(1));
  expect(Keyboard.dismiss).toHaveBeenCalledTimes(1);
  expect(scrollToEnd).not.toHaveBeenCalled();
  await act(async () => {
    hook.blur('received');
    hideKeyboard();
  });
  await act(async () => hook.contentResized());
  expect(scrollToEnd).toHaveBeenCalledWith({ animated: true });
  await act(async () => jest.advanceTimersByTime(50));
  expect(scrollToEnd).toHaveBeenCalledTimes(1);
});

test('a late native blur after keyboard hide does not cancel the intended end scroll', async () => {
  await act(async () => hook.focus('received'));
  await enterReceived();
  await act(async () => jest.advanceTimersByTime(2000));
  await act(async () => {
    hideKeyboard();
    hook.blur('received');
  });
  await act(async () => jest.advanceTimersByTime(50));
  expect(scrollToEnd).toHaveBeenCalledTimes(1);
});

test.each(['', '0', '20,', 'invalid'])(
  'received %s does not trigger automatic dismissal',
  async value => {
    await act(async () => hook.focus('received'));
    await enterReceived(value, false);
    await act(async () => jest.advanceTimersByTime(3000));
    expect(Keyboard.dismiss).not.toHaveBeenCalled();
    expect(scrollToEnd).not.toHaveBeenCalled();
  },
);

test.each(['touch', 'fare', 'background', 'navigation', 'unmount', 'hide'])(
  'received idle action is cancelled by %s',
  async reason => {
    await act(async () => hook.focus('received'));
    await enterReceived();
    await act(async () => {
      if (reason === 'touch') hook.cancel();
      if (reason === 'fare') hook.focus('fare');
      if (reason === 'background') background('background');
      if (reason === 'navigation') {
        mockFocused = false;
        app.update(<Probe />);
      }
      if (reason === 'unmount') app.unmount();
      if (reason === 'hide') hideKeyboard();
    });
    await act(async () => jest.advanceTimersByTime(3000));
    expect(Keyboard.dismiss).not.toHaveBeenCalled();
    expect(scrollToEnd).not.toHaveBeenCalled();
  },
);

test('new interaction after automatic dismiss cancels the pending keyboard-hide completion', async () => {
  await act(async () => hook.focus('received'));
  await enterReceived();
  await act(async () => jest.advanceTimersByTime(2000));
  hook.cancel();
  await act(async () => {
    hideKeyboard();
    jest.advanceTimersByTime(50);
  });
  expect(scrollToEnd).not.toHaveBeenCalled();
});
