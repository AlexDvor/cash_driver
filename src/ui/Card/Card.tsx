import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { styles } from './Card.styles';
import { SurfaceDepth } from '../SurfaceDepth/SurfaceDepth';
import { radii } from '../../constants/theme/tokens';

export function Card({
  children,
  style,
  depth = false,
}: React.PropsWithChildren<{ style?: StyleProp<ViewStyle>; depth?: boolean }>) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        style,
      ]}
    >
      {depth && <SurfaceDepth radius={radii.card} />}
      {children}
    </View>
  );
}
