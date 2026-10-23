import { StyleSheet } from 'react-native';
import { palettes, iconSizing } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  icon: { flexShrink: 0 },
  other: {
    flexShrink: 0,
    backgroundColor: palettes.light.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: iconSizing.platformDotGap,
  },
  dot: { backgroundColor: palettes.light.text },
});
