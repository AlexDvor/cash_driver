import { StyleSheet } from 'react-native';
import { sizing, spacing } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { flexGrow: 1 },
  content: {
    width: '100%',
    maxWidth: sizing.contentMaxWidth,
    alignSelf: 'center',
    gap: spacing.xxl,
  },
});
