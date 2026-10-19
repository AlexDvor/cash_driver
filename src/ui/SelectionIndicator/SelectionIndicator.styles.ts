import { StyleSheet } from 'react-native';
import { sizing, spacing } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  indicator: {
    minWidth: sizing.icon,
    minHeight: sizing.icon,
    borderWidth: sizing.borderWidth,
    borderRadius: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  round: { borderRadius: sizing.icon },
  hidden: { opacity: 0 },
  check: { fontWeight: '700', textAlign: 'center' },
});
