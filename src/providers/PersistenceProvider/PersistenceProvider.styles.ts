import { StyleSheet } from 'react-native';
import {
  fontFamily,
  sizing,
  spacing,
  typography,
} from '../../constants/theme/tokens';

// Bootstrap has no resolved palette until persisted mode is available.
export const styles = StyleSheet.create({
  bootstrap: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.xl,
  },
  message: { fontFamily, fontSize: typography.body, textAlign: 'center' },
  retry: { minHeight: sizing.primaryButton, justifyContent: 'center' },
});
