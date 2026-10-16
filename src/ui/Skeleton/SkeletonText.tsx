import React from 'react';
import { StyleProp, StyleSheet, TextStyle, View } from 'react-native';
import { AppText } from '../AppText/AppText';
import type { AppTextProps } from '../AppText/AppText.interface';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { styles } from './Skeleton.styles';

export function SkeletonText({
  variant = 'body',
  style,
  sizingText = '—',
  numberOfLines,
  adjustsFontSizeToFit,
  minimumFontScale,
  loading = true,
  testID,
}: {
  variant?: AppTextProps['variant'];
  style?: StyleProp<TextStyle>;
  sizingText?: string;
  numberOfLines?: number;
  adjustsFontSizeToFit?: boolean;
  minimumFontScale?: number;
  loading?: boolean;
  testID?: string;
}) {
  const { colors } = useAppTheme();
  const {
    marginLeft,
    flexShrink = 1,
    alignSelf,
    width,
    ...textStyle
  } = StyleSheet.flatten(style) ?? {};
  const fixedLine = numberOfLines === 1 && adjustsFontSizeToFit;
  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden={loading}
      importantForAccessibility={loading ? 'no-hide-descendants' : 'auto'}
      style={[
        styles.textContainer,
        { marginLeft, flexShrink, alignSelf, width },
        sizingText !== '—' && styles.sizedText,
      ]}
    >
      {fixedLine && (
        <AppText
          variant={variant}
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[textStyle, styles.hiddenText]}
        >
          —
        </AppText>
      )}
      {/* Native text supplies font padding and scaled line height, not a fake amount. */}
      <AppText
        variant={variant}
        numberOfLines={numberOfLines}
        adjustsFontSizeToFit={adjustsFontSizeToFit}
        minimumFontScale={minimumFontScale}
        testID={loading ? undefined : testID}
        style={[
          textStyle,
          fixedLine && styles.fittedText,
          loading && styles.hiddenText,
        ]}
      >
        {sizingText || '—'}
      </AppText>
      {loading && (
        <View style={[styles.textBlock, { backgroundColor: colors.border }]} />
      )}
    </View>
  );
}
