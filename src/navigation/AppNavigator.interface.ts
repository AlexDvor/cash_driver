import type React from 'react';
import type { NavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './navigationTypes';

export interface AppNavigatorProps {
  navigationRef?: React.Ref<NavigationContainerRef<RootStackParamList>>;
}
