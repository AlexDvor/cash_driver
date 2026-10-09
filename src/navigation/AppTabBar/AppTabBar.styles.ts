import { StyleSheet } from 'react-native';
import { sizing, spacing } from '../../theme/tokens';

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
    paddingHorizontal: spacing.xs,
  },
  label: { textAlign: 'center', flexShrink: 1 },
  selected: { fontWeight: '700' },
  pressed: { opacity: 0.7 },
});
