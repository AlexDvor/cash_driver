import { StyleSheet } from 'react-native';
import { sizing, spacing, iconSizing } from '../constants/theme/tokens';

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
    left: iconSizing.back.shaftLeft,
    top: iconSizing.back.shaftTop,
    width: iconSizing.back.shaftWidth,
    height: iconSizing.back.stroke,
    borderRadius: iconSizing.back.shaftRadius,
  },
  backHead: {
    position: 'absolute',
    left: iconSizing.back.headLeft,
    top: iconSizing.back.headTop,
    width: iconSizing.back.headSize,
    height: iconSizing.back.headSize,
    borderLeftWidth: iconSizing.back.stroke,
    borderBottomWidth: iconSizing.back.stroke,
    transform: [{ rotate: '45deg' }],
  },
});
