import { StyleSheet } from 'react-native';
import { radii, sizing, spacing } from '../../theme/tokens';

export const styles = StyleSheet.create({
  card: {
    borderRadius: radii.card,
    borderWidth: sizing.borderWidth,
    padding: spacing.xl,
    gap: spacing.lg,
  },
});
