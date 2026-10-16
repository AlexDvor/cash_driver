import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { spacing } from '../../constants/theme/tokens';
import { styles } from './ScreenContainer.styles';
import { ScreenContainerProps } from './ScreenContainer.interface';

export function ScreenContainer({
  children,
  hasHeader = false,
  scrollRef,
  contentRef,
  onInteraction,
  keyboardInset = 0,
  onContentSizeChange,
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
        ref={scrollRef}
        onTouchStart={onInteraction}
        onScrollBeginDrag={onInteraction}
        onContentSizeChange={onContentSizeChange}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: spacing.xl,
            paddingBottom:
              spacing.xl + (hasHeader ? insets.bottom : 0) + keyboardInset,
            paddingLeft: spacing.xl + insets.left,
            paddingRight: spacing.xl + insets.right,
          },
        ]}
      >
        <View
          ref={contentRef}
          collapsable={contentRef ? false : undefined}
          style={styles.content}
        >
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
