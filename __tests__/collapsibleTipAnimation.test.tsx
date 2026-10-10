import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { AccessibilityInfo, Animated, Text, View } from 'react-native';
import { CollapsibleTipContent } from '../src/components/CollapsibleTipContent/CollapsibleTipContent';

const animations: { start: jest.Mock; stop: jest.Mock; reset: jest.Mock }[] =
  [];
const remove = jest.fn();
let query: jest.SpyInstance;
let events: jest.SpyInstance;
let timing: jest.SpyInstance;

beforeEach(() => {
  animations.length = 0;
  remove.mockClear();
  query = jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled');
  query.mockClear();
  query.mockResolvedValue(false);
  events = jest.spyOn(AccessibilityInfo, 'addEventListener');
  events.mockClear();
  events.mockReturnValue({ remove });
  timing = jest.spyOn(Animated, 'timing');
  timing.mockClear();
  timing.mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    reset: jest.fn(),
  }));
  jest.spyOn(Animated, 'parallel').mockImplementation(() => {
    const animation = { start: jest.fn(), stop: jest.fn(), reset: jest.fn() };
    animations.push(animation);
    return animation;
  });
});

afterEach(() => jest.restoreAllMocks());

async function mount(expanded = false) {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  const render = (open: boolean, resetCount: number) => (
    <CollapsibleTipContent expanded={open} resetCount={resetCount}>
      <Text>Tip controls</Text>
    </CollapsibleTipContent>
  );
  await act(async () => {
    renderer = ReactTestRenderer.create(render(expanded, 0));
  });
  return {
    wrapper: () => renderer.root.findByProps({ testID: 'tip-section-content' }),
    measure: async (height: number) => {
      await act(async () => {
        const inner = renderer.root
          .findAllByType(View)
          .find(node => node.props.onLayout);
        if (!inner) throw new Error('Measurement view missing');
        inner.props.onLayout({ nativeEvent: { layout: { height } } });
      });
    },
    update: async (open: boolean, resetCount = 0) => {
      await act(async () => renderer.update(render(open, resetCount)));
    },
    unmount: async () => {
      await act(async () => renderer.unmount());
    },
  };
}

test('initial measurement is instant and hidden controls exclude interaction before animation ends', async () => {
  const section = await mount();
  await section.measure(120);
  expect(timing).not.toHaveBeenCalled();
  await section.update(true);
  expect(timing.mock.calls[0][1]).toMatchObject({
    toValue: 120,
    duration: 180,
    useNativeDriver: false,
  });
  await section.update(false);
  expect(section.wrapper().props.pointerEvents).toBe('none');
  expect(section.wrapper().props.accessibilityElementsHidden).toBe(true);
  expect(section.wrapper().props.importantForAccessibility).toBe(
    'no-hide-descendants',
  );
  expect(animations[0].stop).toHaveBeenCalled();
  expect(timing.mock.calls[2][1].toValue).toBe(0);
  await section.unmount();
  expect(animations[1].stop).toHaveBeenCalled();
  expect(remove).toHaveBeenCalledTimes(1);
});

test('natural height remeasurement and rapid reversals target latest state; create reset snaps', async () => {
  const section = await mount(true);
  await section.measure(120);
  expect(timing).not.toHaveBeenCalled();
  await section.measure(180);
  expect(timing.mock.calls[0][1].toValue).toBe(180);
  await section.update(false);
  await section.update(true);
  expect(animations[0].stop).toHaveBeenCalled();
  expect(animations[1].stop).toHaveBeenCalled();
  expect(timing.mock.calls[4][1].toValue).toBe(180);
  const beforeReset = timing.mock.calls.length;
  await section.update(false, 1);
  expect(timing).toHaveBeenCalledTimes(beforeReset);
  expect(animations[2].stop).toHaveBeenCalled();
  await section.unmount();
});

test.each([true, 'failure'])(
  'Reduce Motion %s disables animation',
  async preference => {
    if (preference === 'failure')
      query.mockRejectedValue(new Error('Unavailable'));
    else query.mockResolvedValue(true);
    const section = await mount();
    await section.measure(120);
    await section.update(true);
    expect(timing).not.toHaveBeenCalled();
    await section.unmount();
  },
);

test('unknown preference disables animation; listener beats late query and snaps active transition', async () => {
  let resolveQuery: (enabled: boolean) => void = () => {
    throw new Error('Query not started');
  };
  query.mockImplementation(
    () =>
      new Promise<boolean>(resolve => {
        resolveQuery = resolve;
      }),
  );
  const section = await mount();
  await section.measure(120);
  await section.update(true);
  expect(timing).not.toHaveBeenCalled();
  await act(async () => events.mock.calls[0][1](false));
  await section.update(false);
  expect(animations).toHaveLength(1);
  await act(async () => events.mock.calls[0][1](true));
  expect(animations[0].stop).toHaveBeenCalled();
  await act(async () => resolveQuery(false));
  await section.update(true);
  expect(animations).toHaveLength(1);
  await section.unmount();
});

test('unmount removes listener and ignores unresolved preference', async () => {
  let resolveQuery: (enabled: boolean) => void = () => {
    throw new Error('Query not started');
  };
  query.mockImplementation(
    () =>
      new Promise<boolean>(resolve => {
        resolveQuery = resolve;
      }),
  );
  const section = await mount();
  await section.unmount();
  await act(async () => resolveQuery(false));
  expect(remove).toHaveBeenCalledTimes(1);
  expect(timing).not.toHaveBeenCalled();
});
