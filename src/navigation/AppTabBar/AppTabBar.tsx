import React from 'react';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, View } from 'react-native';
import { AppText } from '../../ui/AppText/AppText';
import { TabIcon } from '../../ui/TabIcon/TabIcon';
import { useTranslation } from '../../providers/LanguageProvider/LanguageProvider';
import { TranslationKey } from '../../i18n/translations';
import { useAppTheme } from '../../providers/ThemeProvider/ThemeProvider';
import { spacing } from '../../constants/theme/tokens';
import { TabParamList } from '../navigationTypes';
import { styles } from './AppTabBar.styles';
import { routes } from '../routes';

const labels: Record<keyof TabParamList, TranslationKey> = {
  [routes.Home]: 'home',
  [routes.History]: 'history',
  [routes.Summary]: 'summary',
  [routes.Settings]: 'settings',
};

function isTabName(name: string): name is keyof TabParamList {
  return Object.hasOwn(labels, name);
}

export function AppTabBar({ state, navigation, insets }: BottomTabBarProps) {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, spacing.sm),
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        if (!isTabName(route.name)) {
          return null;
        }
        const selected = state.index === index;
        const color = selected ? colors.primary : colors.secondaryText;
        const label = t(labels[route.name]);
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected }}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!selected && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            onLongPress={() =>
              navigation.emit({ type: 'tabLongPress', target: route.key })
            }
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
          >
            <TabIcon name={route.name} color={color} />
            <AppText
              variant="supporting"
              style={[styles.label, { color }, selected && styles.selected]}
            >
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
