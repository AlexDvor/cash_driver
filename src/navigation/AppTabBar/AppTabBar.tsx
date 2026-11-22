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
import { navigationLayout } from '../../constants/theme/layout';

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
          backgroundColor: colors.background,
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
        const color = selected ? colors.primary : colors.tertiaryText;
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
            <View
              style={[
                styles.indicator,
                {
                  // Opaque in both states: switching from transparent dropped the
                  // rounded corners on Android after a tab change.
                  backgroundColor: selected
                    ? colors.softGreen
                    : colors.background,
                },
              ]}
            >
              <TabIcon name={route.name} color={color} />
            </View>
            <AppText
              variant="supporting"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={navigationLayout.labelMinimumFontScale}
              style={[
                styles.label,
                { color: selected ? colors.text : colors.tertiaryText },
                selected && styles.selected,
              ]}
            >
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
