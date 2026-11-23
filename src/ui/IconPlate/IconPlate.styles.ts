import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  plate: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderWidth: 1,
  },
  // Accent glow for the key money icon: a soft translucent halo behind the plate
  // (no elevation shadow, which would ghost during screen transitions).
  glowHalo: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    opacity: 0.16,
  },
});
