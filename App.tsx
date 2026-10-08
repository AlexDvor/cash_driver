import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/app/AppNavigator';
import { LanguageProvider } from './src/i18n/LanguageProvider';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { PersistenceProvider } from './src/app/PersistenceProvider';
import { Persistence } from './src/app/persistence';

export default function App({
  initialize,
}: {
  initialize?: () => Promise<Persistence>;
}) {
  return (
    <SafeAreaProvider>
      <PersistenceProvider initialize={initialize}>
        <LanguageProvider>
          <ThemeProvider>
            <AppNavigator />
          </ThemeProvider>
        </LanguageProvider>
      </PersistenceProvider>
    </SafeAreaProvider>
  );
}
