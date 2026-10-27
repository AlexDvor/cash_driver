import { StyleSheet } from 'react-native';
import {
  iconSizing,
  opacity,
  sizing,
  spacing,
} from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  card: { padding: spacing.md, gap: 0 },
  header: {
    minHeight: sizing.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  text: { flex: 1, gap: spacing.xs },
  label: { fontWeight: '600' },
  circle: {
    width: sizing.icon,
    height: sizing.icon,
    borderRadius: sizing.icon / 2,
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
    opacity: opacity.summaryCircleFill,
  },
  chevron: {
    width: iconSizing.summaryChevron,
    height: iconSizing.summaryChevron,
    borderRightWidth: iconSizing.chevronStroke,
    borderBottomWidth: iconSizing.chevronStroke,
  },
  content: { paddingTop: spacing.md, gap: spacing.md },
  pressed: { opacity: opacity.pressed },
});
