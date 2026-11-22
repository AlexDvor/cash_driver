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
  backCircle: {
    width: sizing.backButton,
    height: sizing.backButton,
    borderRadius: sizing.backButton / 2,
    borderWidth: sizing.borderWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
