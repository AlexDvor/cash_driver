import React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  Theme,
  useNavigation,
} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackHeaderBackProps,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import { SettingsScreen } from '../screens/SettingsScreen/SettingsScreen';
import { SummaryScreen } from '../screens/SummaryScreen/SummaryScreen';
import { DetailsScreen } from '../screens/DetailsScreen/DetailsScreen';
import { EditScreen } from '../screens/EditScreen/EditScreen';
import { HistoryScreen } from '../screens/HistoryScreen/HistoryScreen';
import { HomeScreen } from '../screens/HomeScreen/HomeScreen';
import { useTranslation } from '../providers/LanguageProvider/LanguageProvider';
import { useAppTheme } from '../providers/ThemeProvider/ThemeProvider';
import { AppTabBar } from './AppTabBar/AppTabBar';
import { RootStackParamList, TabParamList } from './navigationTypes';
import { DeletionProvider } from '../providers/DeletionProvider/DeletionProvider';
import { useDeletion } from '../providers/DeletionProvider/DeletionProvider';
import { DeletionNotice } from '../components/DeletionNotice/DeletionNotice';
import { spacing } from '../theme/tokens';
import { AppText } from '../ui/AppText/AppText';
import { AppNavigatorProps } from './AppNavigator.interface';
import { styles } from './AppNavigator.styles';
import { routes } from './routes';

const Tabs = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function HeaderBackButton() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('back')}
      onPress={() => navigation.goBack()}
      style={styles.back}
    >
      <AppText style={{ color: colors.primary }}>←</AppText>
    </Pressable>
  );
}

function renderHeaderBack({ canGoBack }: NativeStackHeaderBackProps) {
  return canGoBack ? <HeaderBackButton /> : null;
}

function renderTabBar(props: BottomTabBarProps) {
  return <AppTabBar {...props} />;
}

function TabNavigator() {
  const { t } = useTranslation();
  return (
    <Tabs.Navigator
      tabBar={renderTabBar}
      screenOptions={{ headerShown: false, animation: 'none' }}
    >
      <Tabs.Screen
        name={routes.Home}
        component={HomeScreen}
        options={{ title: t('home') }}
      />
      <Tabs.Screen
        name={routes.History}
        component={HistoryScreen}
        options={{ title: t('history') }}
      />
      <Tabs.Screen
        name={routes.Summary}
        component={SummaryScreen}
        options={{ title: t('summary') }}
      />
      <Tabs.Screen
        name={routes.Settings}
        component={SettingsScreen}
        options={{ title: t('settings') }}
      />
    </Tabs.Navigator>
  );
}

function DeletionFooter() {
  const { state } = useDeletion();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  if (state.status === 'idle') {
    return null;
  }
  return (
    <View
      style={[
        styles.notice,
        {
          backgroundColor: colors.background,
          paddingLeft: spacing.xl + insets.left,
          paddingRight: spacing.xl + insets.right,
          paddingBottom: spacing.sm + insets.bottom,
        },
      ]}
    >
      <DeletionNotice />
    </View>
  );
}

export function AppNavigator({ navigationRef }: AppNavigatorProps) {
  const { appearance, colors } = useAppTheme();
  const { t } = useTranslation();
  const baseTheme = appearance === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme: Theme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.errorText,
    },
  };
  return (
    <DeletionProvider>
      <NavigationContainer ref={navigationRef} theme={navigationTheme}>
        <View style={styles.fill}>
          <Stack.Navigator
            screenOptions={{
              // Static foundation transitions also respect Reduce Motion.
              animation: 'none',
              statusBarStyle: appearance === 'dark' ? 'light' : 'dark',
              headerTintColor: colors.primary,
              headerBackTitle: t('back'),
              headerBackVisible: false,
              headerLeft: renderHeaderBack,
              headerStyle: { backgroundColor: colors.card },
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen
              name={routes.Tabs}
              component={TabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name={routes.Details}
              component={DetailsScreen}
              options={{ title: t('details') }}
            />
            <Stack.Screen
              name={routes.Edit}
              component={EditScreen}
              options={{ title: t('edit') }}
            />
          </Stack.Navigator>
          <DeletionFooter />
        </View>
      </NavigationContainer>
    </DeletionProvider>
  );
}
