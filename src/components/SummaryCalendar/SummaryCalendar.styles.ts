import { StyleSheet } from 'react-native';
import { spacing } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  // Seven48-unit targets fit inside a384-unit screen without hiding Sunday.
  card: { paddingHorizontal: spacing.xs / 2 },
  navigation: { marginHorizontal: spacing.sm },
});
