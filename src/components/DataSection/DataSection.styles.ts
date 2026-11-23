import { StyleSheet } from 'react-native';
import {
  letterSpacing,
  radii,
  sizing,
  spacing,
  typography,
} from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  groupTitle: {
    paddingHorizontal: spacing.xs,
    fontSize: typography.overline,
    fontWeight: '600',
    letterSpacing: letterSpacing.overline,
    textTransform: 'uppercase',
  },
  card: { gap: 0, paddingVertical: spacing.xs, paddingHorizontal: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: sizing.touchTarget + spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.input,
  },
  rowText: { flex: 1, minWidth: 0, gap: 2 },
  rowTitle: { fontWeight: '600' },
  disabled: { opacity: 0.5 },
  divider: { height: sizing.borderWidth, marginHorizontal: spacing.md },
  status: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  sheet: {
    borderTopLeftRadius: radii.cardLarge,
    borderTopRightRadius: radii.cardLarge,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
    maxHeight: '75%',
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  months: { flexGrow: 0 },
  monthRow: {
    minHeight: sizing.touchTarget + spacing.sm,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: sizing.borderWidth,
    gap: 2,
  },
});
