import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { radii } from '../../constants/theme/tokens';
import { GradientFill } from '../GradientFill/GradientFill';
import { styles } from './Card.styles';

// Surface with a hairline border. No elevation shadow: Android shadows do not
// fade with the screen and ghost during tab transitions.
// `depth` only selects the larger radius. `accent` paints the soft accent
// gradient used for the one hero card per screen.
export function Card({
  children,
  style,
  depth = false,
  accent = false,
}: React.PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  depth?: boolean;
  accent?: boolean;
}>) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        styles.card,
        depth && styles.large,
        {
          backgroundColor: accent ? colors.plateEnd : colors.card,
          borderColor: accent ? colors.plateBorder : colors.border,
        },
        style,
      ]}
    >
      {accent && (
        <GradientFill
          id="cardAccentGradient"
          from={colors.plateStart}
          to={colors.plateEnd}
          radius={depth ? radii.cardLarge : radii.card}
        />
      )}
      {children}
    </View>
  );
}
