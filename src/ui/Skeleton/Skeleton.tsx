import React from 'react';
import { View } from 'react-native';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import type { SkeletonProps } from './Skeleton.interface';
import { styles } from './Skeleton.styles';

export function Skeleton({ width = '100%', height }: SkeletonProps) {
  const { colors } = useAppTheme();
  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.block, { width, height, backgroundColor: colors.border }]}
    />
  );
}
