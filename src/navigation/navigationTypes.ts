import type { NavigatorScreenParams } from '@react-navigation/native';
import { routes } from './routes';

export type TabParamList = {
  [routes.Home]: undefined;
  [routes.History]: undefined;
  [routes.Summary]: undefined;
  [routes.Settings]: undefined;
};

export type RootStackParamList = {
  [routes.Tabs]: NavigatorScreenParams<TabParamList> | undefined;
  [routes.Details]: { id: string };
  [routes.Edit]: { id: string };
};
