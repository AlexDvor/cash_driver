import { StyleSheet } from 'react-native';
import { typography } from '../../theme/tokens';

export const styles = StyleSheet.create({
  title: { fontSize: typography.title, fontWeight: '700' },
  heading: { fontSize: typography.heading, fontWeight: '600' },
  body: { fontSize: typography.body },
  supporting: { fontSize: typography.supporting },
});
