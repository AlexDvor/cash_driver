import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { ChoiceGroup } from '../src/ui/ChoiceGroup/ChoiceGroup';
import { palettes as mockPalettes } from '../src/constants/theme/tokens';

jest.mock('../src/providers/ThemeProvider/ThemeProvider', () => ({
  useAppTheme: () => ({ colors: mockPalettes.light }),
}));

const options = [
  { value: 'day', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
];

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
