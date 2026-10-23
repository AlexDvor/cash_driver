import { StyleSheet } from 'react-native';
import { radii, sizing } from '../../constants/theme/tokens';

export const styles = StyleSheet.create({
  block: { borderRadius: radii.chip, maxWidth: '100%' },
  textContainer: { flexShrink: 1, minWidth: sizing.skeletonTextMinWidth },
  sizedText: { minWidth: 0 },
  hiddenText: { opacity: 0 },
  fittedText: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  textBlock: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: radii.chip,
  },
});
