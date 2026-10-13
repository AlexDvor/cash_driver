import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { ChoiceGroup } from '../src/ui/ChoiceGroup/ChoiceGroup';
import { palettes as mockPalettes } from '../src/constants/theme/tokens';
import { PlatformIcon } from '../src/components/PlatformIcon/PlatformIcon';
import { MultiChoiceGroup } from '../src/ui/MultiChoiceGroup/MultiChoiceGroup';
import { Image, StyleSheet, View } from 'react-native';

jest.mock('../src/providers/ThemeProvider/ThemeProvider', () => ({
  useAppTheme: () => ({ colors: mockPalettes.light }),
}));

const options = [
  { value: 'day', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
];

test.each([1, 2, 3, 4])(
  '%i platform choices share one measured row without changing selection',
  async count => {
    const onChange = jest.fn();
    let app: Renderer.ReactTestRenderer;
    const platforms = ['uber', 'cabify', 'bolt', 'other'].slice(0, count);
    await act(async () => {
      app = Renderer.create(
        <ChoiceGroup
          label="Plataforma"
          columns="equal"
          options={platforms.map(value => ({ value, label: value }))}
          value="uber"
          onChange={onChange}
        />,
      );
    });
    const container = app!.root
      .findAllByType(View)
      .find(node => node.props.onLayout);
    await act(async () =>
      container!.props.onLayout({ nativeEvent: { layout: { width: 360.5 } } }),
    );
    const buttons = app!.root.findAll(
      node =>
        node.props.accessibilityRole === 'radio' &&
        typeof node.props.onPress === 'function',
    );
    const widths = buttons.map(
      button =>
        StyleSheet.flatten(button.props.style({ pressed: false })).width,
    );
    expect(buttons).toHaveLength(count);
    expect(new Set(widths).size).toBe(1);
    expect(Number(widths[0]) * count + 8 * (count - 1)).toBeLessThanOrEqual(
      360.5,
    );
    expect(buttons[0].props.accessibilityState.selected).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
    await act(async () => app!.unmount());
  },
);

test('adaptive inline choices reflow without changing applied selection or requesting a platform change', async () => {
  const onChange = jest.fn();
  let app: Renderer.ReactTestRenderer;
  await act(async () => {
    app = Renderer.create(
      <ChoiceGroup
        label="Plataforma"
        columns="adaptive"
        iconLayout="inline"
        options={options}
        value="week"
        onChange={onChange}
      />,
    );
  });
  const choices = () =>
    app.root.findAll(
      node =>
        node.props.accessibilityRole === 'radio' &&
        typeof node.props.onPress === 'function',
    );
  const layout = async (width: number) => {
    const container = app.root
      .findAllByType(View)
      .find(node => node.props.onLayout);
    await act(async () =>
      container!.props.onLayout({ nativeEvent: { layout: { width } } }),
    );
  };
  await layout(800);
  const twoColumnWidth = StyleSheet.flatten(
    choices()[0].props.style({ pressed: false }),
  ).width;
  expect(twoColumnWidth).toBeLessThan(400);
  await layout(220);
  expect(
    StyleSheet.flatten(choices()[0].props.style({ pressed: false })).width,
  ).toBe(220);
  expect(choices().map(node => node.props.accessibilityState.selected)).toEqual(
    [false, true, false],
  );
  expect(onChange).not.toHaveBeenCalled();
  await act(async () => choices()[2].props.onPress());
  expect(onChange).toHaveBeenCalledWith('month');
  await act(async () => app.unmount());
});

test('platform decorations preserve choice labels, callbacks and last-checkbox protection', async () => {
  const platformOptions = [
    { value: 'uber', label: 'Uber', icon: <PlatformIcon platform="uber" /> },
    {
      value: 'cabify',
      label: 'Cabify',
      icon: <PlatformIcon platform="cabify" />,
    },
    { value: 'other', label: 'Otro', icon: <PlatformIcon platform="other" /> },
  ];
  const onChange = jest.fn();
  const onToggle = jest.fn();
  let app: Renderer.ReactTestRenderer;
  await act(async () => {
    app = Renderer.create(
      <ChoiceGroup
        label="Plataforma"
        options={platformOptions}
        value="uber"
        onChange={onChange}
      />,
    );
  });
  const choices = (role: string) =>
    app.root.findAll(
      node =>
        node.props.accessibilityRole === role &&
        typeof node.props.onPress === 'function',
    );
  expect(choices('radio').map(node => node.props.accessibilityLabel)).toEqual([
    'Uber',
    'Cabify',
    'Otro',
  ]);
  expect(app!.root.findAllByType(Image)).toHaveLength(2);
  for (const image of app!.root.findAllByType(Image)) {
    expect(image.props.accessible).toBe(false);
    expect(image.props.importantForAccessibility).toBe('no-hide-descendants');
    expect(image.props.resizeMode).toBe('contain');
    expect(image.props.source.uri).toBeUndefined();
  }
  await act(async () => choices('radio')[1].props.onPress());
  expect(onChange).toHaveBeenCalledWith('cabify');
  expect(choices('radio')[0].props.accessibilityState.selected).toBe(true);
  await act(async () => {
    app.update(
      <MultiChoiceGroup
        label="Plataformas de trabajo"
        options={platformOptions}
        values={['uber']}
        lastChoiceHint="Select at least one platform"
        onToggle={onToggle}
      />,
    );
  });
  expect(choices('checkbox')[0].props.disabled).toBe(true);
  expect(choices('checkbox')[0].props.accessibilityHint).toBe(
    'Select at least one platform',
  );
  expect(choices('checkbox')[1].props.disabled).toBe(false);
  await act(async () => choices('checkbox')[1].props.onPress());
  expect(onToggle).toHaveBeenCalledWith('cabify');
  await act(async () => app.unmount());
});

test.each(['chips', 'segmented'] as const)(
  '%s choices expose applied selection and deliver the selected period without local state',
  async appearance => {
    const onChange = jest.fn();
    let app: Renderer.ReactTestRenderer;
    await act(async () => {
      app = Renderer.create(
        <ChoiceGroup
          appearance={appearance}
          label="Período"
          options={options}
          value="day"
          onChange={onChange}
        />,
      );
    });
    const buttons = () =>
      app.root.findAll(
        node =>
          node.props.accessibilityRole === 'radio' &&
          typeof node.props.onPress === 'function',
      );
    expect(
      buttons().map(button => button.props.accessibilityState.selected),
    ).toEqual([true, false, false]);
    await act(async () => buttons()[2].props.onPress());
    expect(onChange).toHaveBeenCalledWith('month');
    // A request is not an applied selection until the owner supplies its value.
    expect(buttons()[0].props.accessibilityState.selected).toBe(true);
    await act(async () =>
      app.update(
        <ChoiceGroup
          appearance={appearance}
          label="Період"
          options={[
            { value: 'day', label: 'Сьогодні' },
            { value: 'week', label: 'Тиждень' },
            { value: 'month', label: 'Місяць' },
          ]}
          value="month"
          onChange={onChange}
        />,
      ),
    );
    expect(buttons()[2].props.accessibilityLabel).toBe('Місяць');
    expect(
      buttons().map(button => button.props.accessibilityState.selected),
    ).toEqual([false, false, true]);
    await act(async () => app.unmount());
  },
);

test('segmented choices preserve disabled controls and accessibility semantics', async () => {
  let app: Renderer.ReactTestRenderer;
  await act(async () => {
    app = Renderer.create(
      <ChoiceGroup
        appearance="segmented"
        label="Período"
        options={options}
        value="week"
        onChange={jest.fn()}
        disabled
      />,
    );
  });
  const buttons = app!.root.findAll(
    node =>
      node.props.accessibilityRole === 'radio' &&
      typeof node.props.onPress === 'function',
  );
  expect(buttons).toHaveLength(3);
  for (const button of buttons) {
    expect(button.props.disabled).toBe(true);
    expect(button.props.accessibilityRole).toBe('radio');
    expect(button.props.accessibilityState.disabled).toBe(true);
  }
  await act(async () => app!.unmount());
});
