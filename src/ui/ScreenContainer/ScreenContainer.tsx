import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme/ThemeProvider';
import { spacing } from '../../theme/tokens';
import { styles } from './ScreenContainer.styles';
import { ScreenContainerProps } from './ScreenContainer.interface';

export function ScreenContainer({
  children,
  hasHeader = false,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const viewportTopInset = hasHeader ? 0 : insets.top;
  return (
    <KeyboardAvoidingView
      style={[
        styles.fill,
        {
          backgroundColor: colors.background,
          // Reserve the viewport inset so scrolled controls stay below the bar.
          paddingTop: viewportTopInset,
        },
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: spacing.xl,
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
