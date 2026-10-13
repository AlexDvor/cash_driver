import { StyleSheet } from 'react-native';
import { palettes } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  icon: { flexShrink: 0 },
  other: {
    flexShrink: 0,
    backgroundColor: palettes.light.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  dot: { backgroundColor: palettes.light.text },
});
