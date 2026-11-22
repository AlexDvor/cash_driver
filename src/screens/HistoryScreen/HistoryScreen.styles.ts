import { StyleSheet } from 'react-native';
import {
  iconSizing,
  radii,
  sizing,
  spacing,
  typography,
} from '../../constants/theme/tokens';

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
  groupHeading: { paddingTop: spacing.xl, paddingBottom: spacing.sm },
  footer: { paddingTop: spacing.xxl },
  heading: { gap: 2, flexShrink: 1 },
  platformHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexShrink: 1,
    flexGrow: 1,
  },
  // One day = one grouped card: side borders on every row, top/bottom only at the ends.
  row: {
    borderLeftWidth: sizing.borderWidth,
    borderRightWidth: sizing.borderWidth,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: sizing.touchTarget,
    justifyContent: 'center',
  },
  rowFirst: {
    borderTopWidth: sizing.borderWidth,
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
  },
  rowLast: {
    borderBottomWidth: sizing.borderWidth,
    borderBottomLeftRadius: radii.card,
    borderBottomRightRadius: radii.card,
  },
  // Inset hairline between rows, aligned with the text after the platform logo.
  rowDivider: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: spacing.lg + iconSizing.historyPlatform + spacing.md,
    height: sizing.borderWidth,
  },
  rowContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.md,
  },
  platformName: { fontWeight: '600' },
  time: { fontSize: typography.caption },
  amounts: {
    flexShrink: 1,
    gap: 2,
    marginLeft: 'auto',
    alignItems: 'flex-end',
  },
  money: { textAlign: 'right', fontVariant: ['tabular-nums'] },
  fare: { fontWeight: '600' },
  tip: { fontSize: typography.caption, fontWeight: '600' },
  empty: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.xxl * 2,
    paddingBottom: spacing.xl,
  },
  emptyTitle: { textAlign: 'center' },
  emptyAction: { alignSelf: 'stretch' },
});
