import { StyleSheet } from 'react-native';
import { sizing, spacing } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: sizing.borderWidth,
    paddingTop: spacing.sm,
  },
  tab: {
    flex: 1,
    minHeight: sizing.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  // Centered children need an explicit width so scaled labels wrap inside a tab.
  label: { width: '100%', textAlign: 'center' },
  selected: { fontWeight: '700' },
  pressed: { opacity: 0.7 },
});
