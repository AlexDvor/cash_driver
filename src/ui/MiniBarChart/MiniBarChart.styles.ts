import { StyleSheet } from 'react-native';
import { spacing } from '../../constants/theme/tokens';

export const chartHeight = 56;

export const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  bars: {
    height: chartHeight,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  slot: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 2 },
  line: { height: 2 },
  axis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  axisLabel: { fontSize: 12, fontWeight: '500', flexShrink: 1 },
  axisEnd: { textAlign: 'right' },
});
