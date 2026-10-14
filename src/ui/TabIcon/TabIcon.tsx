import React from 'react';
import { TabParamList } from '../../navigation/navigationTypes';
import { routes } from '../../navigation/routes';
import { sizing } from '../../constants/theme/tokens';
import HomeIcon from '../../assets/navigation/home.svg';
import HistoryIcon from '../../assets/navigation/history.svg';
import SummaryIcon from '../../assets/navigation/summary.svg';
import SettingsIcon from '../../assets/navigation/settings.svg';

const icons = {
  [routes.Home]: HomeIcon,
  [routes.History]: HistoryIcon,
  [routes.Summary]: SummaryIcon,
  [routes.Settings]: SettingsIcon,
};

export function TabIcon({
  name,
  color,
}: {
  name: keyof TabParamList;
  color: string;
}) {
  const Icon = icons[name];
  return (
    <Icon
      width={sizing.icon}
      height={sizing.icon}
      color={color}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    />
  );
}
