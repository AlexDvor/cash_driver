import React from 'react';
import { View } from 'react-native';
import Trash from '../../assets/settings/trash.svg';
import Play from '../../assets/settings/play.svg';
import { sizing } from '../../constants/theme/tokens';
import { styles } from './SettingsIcon.styles';

const icons = {
  trash: Trash,
  play: Play,
};

export function SettingsIcon({
  name,
  color,
  size = sizing.icon,
}: {
  name: keyof typeof icons;
  color: string;
  size?: number;
}) {
  const Icon = icons[name];
  return (
    <View
      testID={`settings-icon-${name}`}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={styles.icon}
    >
      <Icon width={size} height={size} color={color} accessible={false} />
    </View>
  );
}
