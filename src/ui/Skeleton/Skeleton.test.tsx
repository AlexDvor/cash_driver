import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { StyleSheet, View } from 'react-native';
import { palettes as mockPalettes } from '../../constants/theme/tokens';
import { Skeleton } from './Skeleton';
import { LoadingSkeleton } from '../../components/LoadingSkeleton/LoadingSkeleton';
import { SkeletonText } from './SkeletonText';
import { AppText } from '../AppText/AppText';

let mockAppearance: 'light' | 'dark' = 'light';
jest.mock('../../providers/ThemeProvider/ThemeProvider', () => ({
  useAppTheme: () => ({ colors: mockPalettes[mockAppearance] }),
}));

test('skeleton is decorative and follows theme updates without recreating its content', async () => {
  let app!: Renderer.ReactTestRenderer;
  mockAppearance = 'light';
  await act(async () => {
    app = Renderer.create(<Skeleton width="60%" height={20} />);
  });
  const block = app.root.findByType(View);
  expect(block.props.pointerEvents).toBe('none');
  expect(block.props.accessible).toBe(false);
  expect(block.props.accessibilityElementsHidden).toBe(true);
  expect(block.props.importantForAccessibility).toBe('no-hide-descendants');
  expect(StyleSheet.flatten(block.props.style).backgroundColor).toBe(
    mockPalettes.light.border,
  );
  mockAppearance = 'dark';
  await act(async () => app.update(<Skeleton width="60%" height={20} />));
  expect(app.root.findByType(View)).toBe(block);
  expect(StyleSheet.flatten(block.props.style).backgroundColor).toBe(
    mockPalettes.dark.border,
  );
  await act(async () => app.unmount());
});

test('loading text stays available while all placeholder descendants are hidden', async () => {
  let app!: Renderer.ReactTestRenderer;
  await act(async () => {
    app = Renderer.create(
      <LoadingSkeleton label="Завантаження">
        <Skeleton height={20} />
      </LoadingSkeleton>,
    );
  });
  const hidden = app.root
    .findAllByType(View)
    .find(
      node => node.props.importantForAccessibility === 'no-hide-descendants',
    );
  expect(hidden?.findAllByType(Skeleton)).toHaveLength(1);
  expect(
    hidden?.findAll(node => node.props.children === 'Завантаження'),
  ).toHaveLength(0);
  const status = app.root.findAll(
    node => node.props.accessibilityLiveRegion === 'polite',
  )[0];
  expect(status).toBeDefined();
  expect(status.props.accessibilityRole).toBe('progressbar');
  expect(status.props.accessibilityLabel).toBe('Завантаження');
  expect(status.props.accessibilityState.busy).toBe(true);
  expect(JSON.stringify(app.toJSON())).toContain('Завантаження');
  await act(async () => app.unmount());
});

test('text placeholder reserves native typography without a synthetic amount', async () => {
  let app!: Renderer.ReactTestRenderer;
  await act(async () => {
    app = Renderer.create(
      <SkeletonText variant="heading" style={{ fontSize: 56 }} />,
    );
  });
  const text = app.root.findByType(AppText);
  expect(text.props.children).toBe('—');
  expect(text.props.testID).toBeUndefined();
  expect(StyleSheet.flatten(text.props.style)).toMatchObject({
    fontSize: 56,
    opacity: 0,
  });
  const wrapper = app.root
    .findAllByType(View)
    .find(node => node.props.pointerEvents === 'none');
  expect(wrapper?.props.accessibilityElementsHidden).toBe(true);
  await act(async () => app.unmount());
});

test('placeholder retains hidden sizing text and puts alignment on the flex child', async () => {
  let app!: Renderer.ReactTestRenderer;
  await act(async () => {
    app = Renderer.create(
      <SkeletonText
        sizingText="Operations: 1234"
        style={{ marginLeft: 'auto', fontSize: 24 }}
      />,
    );
  });
  const wrapper = app.root
    .findAllByType(View)
    .find(node => node.props.pointerEvents === 'none')!;
  expect(StyleSheet.flatten(wrapper.props.style)).toMatchObject({
    marginLeft: 'auto',
    minWidth: 0,
  });
  expect(wrapper.props.importantForAccessibility).toBe('no-hide-descendants');
  expect(
    StyleSheet.flatten(app.root.findByType(AppText).props.style).opacity,
  ).toBe(0);
  await act(async () => app.unmount());
});

test('ready text keeps its native tree through skeleton loading and back', async () => {
  let app!: Renderer.ReactTestRenderer;
  const render = (loading: boolean) => (
    <SkeletonText
      loading={loading}
      testID="value"
      sizingText="123,45 €"
      style={{ marginLeft: 'auto' }}
    />
  );
  await act(async () => {
    app = Renderer.create(render(false));
  });
  const text = app.root.findByType(AppText);
  const wrapper = app.root.findByType(View);
  await act(async () => app.update(render(true)));
  expect(app.root.findByType(AppText)).toBe(text);
  expect(app.root.findAllByType(View)[0]).toBe(wrapper);
  expect(text.props.testID).toBeUndefined();
  expect(wrapper.props.accessibilityElementsHidden).toBe(true);
  await act(async () => app.update(render(false)));
  expect(app.root.findByType(AppText)).toBe(text);
  expect(text.props.testID).toBe('value');
  expect(wrapper.props.accessibilityElementsHidden).toBe(false);
  await act(async () => app.unmount());
});

test('loading retains measured ready extent and releases it for genuinely shorter results', async () => {
  let app!: Renderer.ReactTestRenderer;
  const render = (loading: boolean) => (
    <LoadingSkeleton loading={loading} preserveHeight label="Loading">
      <View />
    </LoadingSkeleton>
  );
  await act(async () => {
    app = Renderer.create(render(false));
  });
  const root = app.root.findAllByType(View).find(node => node.props.onLayout)!;
  await act(async () =>
    root.props.onLayout({ nativeEvent: { layout: { height: 800 } } }),
  );
  await act(async () => app.update(render(true)));
  expect(StyleSheet.flatten(root.props.style).minHeight).toBe(800);
  await act(async () =>
    root.props.onLayout({ nativeEvent: { layout: { height: 100 } } }),
  );
  expect(StyleSheet.flatten(root.props.style).minHeight).toBe(800);
  await act(async () => app.update(render(false)));
  expect(StyleSheet.flatten(root.props.style).minHeight).toBeUndefined();
  await act(async () => app.unmount());
});
