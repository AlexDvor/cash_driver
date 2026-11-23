import { StyleSheet } from 'react-native';
import {
  radii,
  sizing,
  spacing,
  opacity,
  typography,
} from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  labelFrame: { flex: 1 },
  // Month label: icon and text sit together in the middle of the button.
  monthGroup: { flexShrink: 1, minWidth: 0 },
  labelMeasureHidden: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
    overflow: 'hidden',
  },
  labelMeasure: {
    width: '100%',
    flexDirection: 'row',
    opacity: 0,
    overflow: 'hidden',
  },
  labelSample: { width: '100%', flexShrink: 0 },
  labelOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
  },
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
    minHeight: sizing.primaryButton,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
  },
  fullWidth: { flexBasis: '100%', flexGrow: 0, flexShrink: 0 },
  label: {
    flexShrink: 1,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: typography.supporting + 1, // 15: a touch smaller so month and year fit.
  },
  pressed: { opacity: opacity.pressed },
  disabled: { opacity: opacity.disabled },
  button: {
    minHeight: sizing.touchTarget,
    minWidth: sizing.touchTarget,
    flexShrink: 0,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
});
