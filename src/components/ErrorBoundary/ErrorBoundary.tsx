import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import {
  palettes,
  radii,
  spacing,
  typography,
} from '../../constants/theme/tokens';

const copy = {
  es: {
    title: 'Algo salió mal',
    body: 'Tus datos guardados siguen en el dispositivo. Inténtalo de nuevo.',
    retry: 'Reintentar',
  },
  en: {
    title: 'Something went wrong',
    body: 'Your saved data is still on the device. Try again.',
    retry: 'Try again',
  },
} as const;

function deviceLanguage(): 'es' | 'en' {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale.startsWith('es')
      ? 'es'
      : 'en';
  } catch {
    return 'en';
  }
}

function Fallback({ onRetry }: { onRetry: () => void }) {
  // Rendered outside the app providers, so it reads the device settings itself.
  const colors = palettes[useColorScheme() === 'light' ? 'light' : 'dark'];
  const text = copy[deviceLanguage()];
  return (
    <View
      testID="error-fallback"
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <Text
        accessibilityRole="header"
        style={[styles.title, { color: colors.text }]}
      >
        {text.title}
      </Text>
      <Text style={[styles.body, { color: colors.secondaryText }]}>
        {text.body}
      </Text>
      <Pressable
        testID="error-retry"
        accessibilityRole="button"
        accessibilityLabel={text.retry}
        onPress={onRetry}
        style={[styles.button, { backgroundColor: colors.accentFill }]}
      >
        <Text style={[styles.buttonText, { color: colors.onAccent }]}>
          {text.retry}
        </Text>
      </Pressable>
    </View>
  );
}

// Last line of defense: a render error shows a calm screen with a retry
// button (which remounts the app) instead of closing the app.
export class ErrorBoundary extends React.Component<
  React.PropsWithChildren,
  { failed: boolean; attempt: number }
> {
  state = { failed: false, attempt: 0 };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Unhandled render error', error);
  }

  render() {
    if (this.state.failed) {
      return (
        <Fallback
          onRetry={() =>
            this.setState(({ attempt }) => ({
              failed: false,
              attempt: attempt + 1,
            }))
          }
        />
      );
    }
    return (
      <React.Fragment key={this.state.attempt}>
        {this.props.children}
      </React.Fragment>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
  },
  title: { fontSize: typography.title, fontWeight: '700', textAlign: 'center' },
  body: { fontSize: typography.body, textAlign: 'center' },
  button: {
    marginTop: spacing.lg,
    minHeight: 48,
    paddingHorizontal: spacing.xxl,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: typography.body, fontWeight: '600' },
});
