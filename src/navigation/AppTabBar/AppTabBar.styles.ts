import { StyleSheet } from 'react-native';
import {
  sizing,
  spacing,
  opacity,
  typography,
} from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: sizing.borderWidth,
    paddingTop: spacing.sm,
  },
  tab: {
    flex: 1,
    minHeight: sizing.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: 2,
  },
  // Pill behind the active tab icon (Figma TabBar).
  // Exact half-height radius: a huge "pill" radius rendered square on Android here.
  indicator: {
    borderRadius: (sizing.icon + spacing.xs * 2) / 2,
    paddingHorizontal: 18,
    paddingVertical: spacing.xs,
  },
  // Explicit width lets native text fit inside each equal-width touch target.
  label: { width: '100%', textAlign: 'center', fontSize: typography.tabLabel },
  selected: { fontWeight: '600' },
  pressed: { opacity: opacity.pressed },
});
