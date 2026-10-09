import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { ScreenContainer } from '../src/ui/ScreenContainer/ScreenContainer';
import { spacing } from '../src/theme/tokens';

jest.mock('../src/theme/ThemeProvider', () => ({
  useAppTheme: () => ({
    colors: require('../src/theme/tokens').palettes.light,
  }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 37, left: 4, right: 5, bottom: 16 }),
}));

test.each([false, true])(
  'reserves the non-scrolling top inset once, native header=%s',
  async hasHeader => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
    try {
      await act(async () => {
        renderer = ReactTestRenderer.create(
          <ScreenContainer hasHeader={hasHeader}>
            <Text>Scrollable controls</Text>
          </ScreenContainer>,
        );
      });
      if (!renderer) {
        throw new Error('Missing screen');
      }
      const viewport = StyleSheet.flatten(
        renderer.root.findByType(KeyboardAvoidingView).props.style,
      );
      const content = StyleSheet.flatten(
        renderer.root.findByType(ScrollView).props.contentContainerStyle,
      );
      expect(viewport.paddingTop).toBe(hasHeader ? 0 : 37);
      expect(content.paddingTop).toBe(spacing.xl);
      expect(content.paddingLeft).toBe(spacing.xl + 4);
      expect(content.paddingRight).toBe(spacing.xl + 5);
    } finally {
      await act(async () => renderer?.unmount());
    }
  },
);
