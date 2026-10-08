import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/app/AppNavigator';
import { LanguageProvider } from './src/i18n/LanguageProvider';
import { ThemeProvider } from './src/theme/ThemeProvider';

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider>
          <AppNavigator />
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
