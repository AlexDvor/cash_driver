import { StyleSheet } from 'react-native';
import { radii, sizing, spacing } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  embedded: { borderWidth: 0, padding: 0 },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    padding: spacing.sm,
    borderWidth: sizing.borderWidth,
    borderRadius: radii.card,
  },
  monthButton: {
    flex: 1,
    minHeight: sizing.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radii.chip,
  },
  fullWidth: { flexBasis: '100%', flexGrow: 0, flexShrink: 0 },
  label: { flexShrink: 1, textAlign: 'center', fontWeight: '600' },
  dropdown: {
    width: 7,
    height: 7,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: '45deg' }],
  },
  pressed: { opacity: 0.7 },
  button: {
    minHeight: sizing.touchTarget,
    minWidth: sizing.touchTarget,
    flexShrink: 0,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.chip,
  },
});
