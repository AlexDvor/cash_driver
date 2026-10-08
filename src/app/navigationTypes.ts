import { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Home: undefined;
  History: undefined;
  Summary: undefined;
  Settings: undefined;
};

// Transaction params will be defined with the actual history flow, not sample data.
export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  Details: undefined;
  Edit: undefined;
};
