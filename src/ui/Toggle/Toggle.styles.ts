import { StyleSheet } from 'react-native';
import { sizing } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  track: {
    width: sizing.toggleWidth,
    height: sizing.toggleHeight,
    borderRadius: sizing.toggleHeight / 2,
    padding: sizing.toggleInset,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  trackOn: { alignItems: 'flex-end' },
  knob: {
    width: sizing.toggleHeight - sizing.toggleInset * 2,
    height: sizing.toggleHeight - sizing.toggleInset * 2,
    borderRadius: (sizing.toggleHeight - sizing.toggleInset * 2) / 2,
  },
});
