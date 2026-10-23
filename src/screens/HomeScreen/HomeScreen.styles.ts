import { StyleSheet } from 'react-native';
import { spacing, typography } from '../../constants/theme/tokens';
export const styles = StyleSheet.create({
  header: { gap: spacing.xs },
  title: { fontSize: typography.homeTitle, fontWeight: '700' },
});
