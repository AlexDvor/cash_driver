import { StyleSheet } from 'react-native';
import { radii, sizing, spacing } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: sizing.contentMaxWidth,
    alignSelf: 'center',
  },
  controls: { gap: spacing.xxl },
  feedback: { gap: spacing.md },
  groupHeading: { paddingTop: spacing.xxl, paddingBottom: spacing.md },
  separator: { height: spacing.md },
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
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.sm,
    minHeight: sizing.touchTarget,
  },
  rowContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  amounts: { flexShrink: 1, gap: spacing.xs },
  pressed: { opacity: 0.7 },
});
