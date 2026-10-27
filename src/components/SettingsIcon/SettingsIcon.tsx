import React from 'react';
import { View } from 'react-native';
import Sun from '../../assets/settings/sun.svg';
import Moon from '../../assets/settings/moon.svg';
import Phone from '../../assets/settings/phone.svg';
import Database from '../../assets/settings/database.svg';
import Trash from '../../assets/settings/trash.svg';
import Palette from '../../assets/settings/palette.svg';
import Briefcase from '../../assets/settings/briefcase.svg';
import Info from '../../assets/settings/info.svg';
import Check from '../../assets/settings/check.svg';
import Play from '../../assets/settings/play.svg';
import { sizing } from '../../constants/theme/tokens';
import { styles } from './SettingsIcon.styles';

const icons = {
  sun: Sun,
  moon: Moon,
  phone: Phone,
  database: Database,
  trash: Trash,
  palette: Palette,
  briefcase: Briefcase,
  info: Info,
  check: Check,
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
