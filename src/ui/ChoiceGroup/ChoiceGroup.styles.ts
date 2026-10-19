import { StyleSheet } from 'react-native';
import { radii, sizing, spacing } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  singleRowViewport: { flexGrow: 0 },
  singleRow: { flexDirection: 'row', gap: spacing.sm },
  compactChoice: { paddingHorizontal: spacing.xs },
  decorationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  centeredDecoration: { alignSelf: 'stretch', gap: 0 },
  decorationSide: {
    flex: 1,
    minWidth: sizing.icon,
    alignItems: 'center',
  },
  choice: {
    minHeight: sizing.touchTarget,
    borderRadius: radii.chip,
    borderWidth: sizing.borderWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    flexShrink: 1,
  },
  label: { textAlign: 'center' },
  equalChoice: { paddingHorizontal: spacing.xs },
  inline: { flexDirection: 'row', gap: spacing.sm },
  inlineLabel: { flexShrink: 1 },
  segment: {
    flexBasis: 'auto',
    flexGrow: 1,
    borderRadius: radii.button,
  },
  pressed: { opacity: 0.8 },
  selected: { fontWeight: '700' },
});
