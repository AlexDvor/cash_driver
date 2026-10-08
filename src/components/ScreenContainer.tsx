import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/ThemeProvider';
import { sizing, spacing } from '../theme/tokens';

interface ScreenContainerProps extends React.PropsWithChildren {
  // Native stack headers already consume the top inset; tabs hide their header.
  hasHeader?: boolean;
}

export function ScreenContainer({
  children,
  hasHeader = false,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  return (
    <KeyboardAvoidingView
      style={[styles.fill, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: spacing.xl + (hasHeader ? 0 : insets.top),
            paddingBottom: spacing.xl + (hasHeader ? insets.bottom : 0),
            paddingLeft: spacing.xl + insets.left,
            paddingRight: spacing.xl + insets.right,
          },
        ]}
      >
        <View style={styles.content}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { flexGrow: 1 },
  content: {
    width: '100%',
    maxWidth: sizing.contentMaxWidth,
    alignSelf: 'center',
    gap: spacing.xxl,
  },
});
