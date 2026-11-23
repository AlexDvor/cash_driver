import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { LanguageProvider } from './src/providers/LanguageProvider/LanguageProvider';
import { ThemeProvider } from './src/providers/ThemeProvider/ThemeProvider';
import { PersistenceProvider } from './src/providers/PersistenceProvider/PersistenceProvider';
import { Persistence } from './src/app/persistence';
import { ErrorBoundary } from './src/components/ErrorBoundary/ErrorBoundary';

export default function App({
  initialize,
}: {
  initialize?: () => Promise<Persistence>;
}) {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <PersistenceProvider initialize={initialize}>
          <LanguageProvider>
            <ThemeProvider>
              <AppNavigator />
            </ThemeProvider>
          </LanguageProvider>
        </PersistenceProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
