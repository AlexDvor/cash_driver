import { StyleSheet } from 'react-native';
import { radii, sizing, spacing, opacity } from '../../constants/theme/tokens';

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
    minHeight: sizing.primaryButton,
    borderRadius: radii.chip,
    borderWidth: sizing.borderWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    flexShrink: 1,
  },
  compact: { minHeight: sizing.touchTarget, paddingVertical: spacing.xs },
  label: { textAlign: 'center' },
  equalChoice: { paddingHorizontal: spacing.xs },
  inline: { flexDirection: 'row', gap: spacing.sm },
  inlineLabel: { flexShrink: 1 },
  // Card-like radii (not pills) so the control still looks right when large
  // text makes the segments wrap onto a second row.
  segment: {
    flexBasis: 'auto',
    flexGrow: 1,
    borderRadius: radii.input,
  },
  segmentTray: {
    borderWidth: sizing.borderWidth,
    borderRadius: radii.card,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  // Selected chips get a slightly heavier accent border (layout size unchanged).
  selectedChoice: { borderWidth: 1.5 },
  pressed: { opacity: opacity.choicePressed },
  selected: { fontWeight: '700' },
});
