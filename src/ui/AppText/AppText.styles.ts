import { StyleSheet } from 'react-native';
import {
  fontFamily,
  letterSpacing,
  typography,
} from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  font: { fontFamily },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
    letterSpacing: letterSpacing.title,
  },
  heading: { fontSize: typography.heading, fontWeight: '600' },
  body: { fontSize: typography.body },
  supporting: { fontSize: typography.supporting, fontWeight: '500' },
});
