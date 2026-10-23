import { StyleSheet } from 'react-native';
import {
  radii,
  sizing,
  spacing,
  opacity,
  iconSizing,
} from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  card: { gap: spacing.md },
  platformRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  platformLabel: { flexShrink: 1 },
  singlePlatform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: sizing.touchTarget,
    paddingHorizontal: spacing.sm,
  },
  stackedActions: { flexDirection: 'column' },
  fullWidthAction: { flexBasis: 'auto', width: '100%' },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quick: {
    minHeight: sizing.touchTarget,
    borderRadius: radii.chip,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    flexShrink: 1,
  },
  pressed: { opacity: opacity.pressed },
  quickLabel: { textAlign: 'center', fontWeight: '700' },
  tipAction: {
    flexBasis: '45%',
    flexGrow: 1,
    borderWidth: sizing.borderWidth,
  },
  actionLabel: { textAlign: 'center' },
  tipBlock: { gap: spacing.sm },
  tipLabel: { flex: 1 },
  tipChevron: {
    width: iconSizing.tipChevron,
    height: iconSizing.tipChevron,
    borderRightWidth: iconSizing.chevronStroke,
    borderBottomWidth: iconSizing.chevronStroke,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: sizing.touchTarget,
    borderWidth: sizing.borderWidth,
    borderRadius: radii.chip,
    padding: spacing.sm,
    justifyContent: 'center',
  },
});
