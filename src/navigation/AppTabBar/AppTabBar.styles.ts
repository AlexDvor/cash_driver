import { StyleSheet } from 'react-native';
import {
  sizing,
  spacing,
  opacity,
  typography,
} from '../../constants/theme/tokens';

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
    paddingHorizontal: 2,
  },
  // Centered children need an explicit width so scaled labels wrap inside a tab.
  label: { width: '100%', textAlign: 'center', fontSize: typography.tabLabel },
  selected: { fontWeight: '700' },
  pressed: { opacity: opacity.pressed },
});
