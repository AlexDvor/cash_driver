import { StyleSheet } from 'react-native';
import { spacing } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  clipping: { overflow: 'hidden' },
  content: { position: 'absolute', top: 0, left: 0, right: 0, gap: spacing.sm },
});
