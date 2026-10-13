import { StyleSheet } from 'react-native';
import { sizing, spacing } from '../constants/theme/tokens';

export const styles = StyleSheet.create({
  fill: { flex: 1 },
  notice: { paddingTop: spacing.sm },
  back: {
    minWidth: sizing.touchTarget,
    minHeight: sizing.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { width: sizing.icon, height: sizing.icon },
  backShaft: {
    position: 'absolute',
    left: 3,
    top: 11,
    width: 20,
    height: 2.5,
    borderRadius: 2,
  },
  backHead: {
    position: 'absolute',
    left: 4,
    top: 6,
    width: 12,
    height: 12,
    borderLeftWidth: 2.5,
    borderBottomWidth: 2.5,
    transform: [{ rotate: '45deg' }],
  },
});
