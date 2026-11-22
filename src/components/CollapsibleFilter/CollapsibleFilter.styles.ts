import { StyleSheet } from 'react-native';
import {
  iconSizing,
  opacity,
  sizing,
  spacing,
  typography,
} from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  card: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: 0,
  },
  header: {
    minHeight: sizing.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  text: { flex: 1, gap: 2 },
  label: { fontSize: typography.caption },
  value: { fontWeight: '600' },
  // Same round accent chevron button as the daily summary.
  circle: {
    width: sizing.iconButton,
    height: sizing.iconButton,
    borderRadius: sizing.iconButton / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  circleFill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  chevron: {
    width: iconSizing.summaryChevron,
    height: iconSizing.summaryChevron,
    borderRightWidth: iconSizing.chevronStroke,
    borderBottomWidth: iconSizing.chevronStroke,
  },
  content: { paddingTop: spacing.sm, paddingBottom: spacing.sm, gap: spacing.md },
  pressed: { opacity: opacity.pressed },
});
