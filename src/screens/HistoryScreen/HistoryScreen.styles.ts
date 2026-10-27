import { StyleSheet } from 'react-native';
import { radii, sizing, spacing, opacity } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: sizing.contentMaxWidth,
    alignSelf: 'center',
  },
  controls: { gap: spacing.md },
  feedback: { gap: spacing.md },
  groupHeading: { paddingTop: spacing.lg, paddingBottom: spacing.sm },
  separator: { height: spacing.sm },
  footer: { paddingTop: spacing.xxl },
  heading: { gap: spacing.xs, flexShrink: 1 },
  platformHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexShrink: 1,
  },
  row: {
    borderWidth: sizing.borderWidth,
    borderRadius: radii.chip,
    padding: spacing.md,
    gap: spacing.sm,
    minHeight: sizing.touchTarget,
  },
  rowContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  amounts: {
    flexShrink: 1,
    gap: spacing.xs,
    marginLeft: 'auto',
    alignItems: 'flex-end',
  },
  money: { textAlign: 'right', fontVariant: ['tabular-nums'] },
  pressed: { opacity: opacity.pressed },
});
