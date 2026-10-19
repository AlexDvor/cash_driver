import React from 'react';
import { View } from 'react-native';
import Sun from '../../assets/settings/sun.svg';
import Moon from '../../assets/settings/moon.svg';
import Phone from '../../assets/settings/phone.svg';
import Database from '../../assets/settings/database.svg';
import Trash from '../../assets/settings/trash.svg';
import { sizing } from '../../constants/theme/tokens';
import { styles } from './SettingsIcon.styles';

const icons = {
  sun: Sun,
  moon: Moon,
  phone: Phone,
  database: Database,
  trash: Trash,
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
