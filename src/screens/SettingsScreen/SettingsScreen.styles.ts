import { StyleSheet } from 'react-native';
import { sizing, spacing } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: sizing.touchTarget,
  },
  toggleLabel: { flexShrink: 1 },
  divider: { height: sizing.borderWidth },
});
