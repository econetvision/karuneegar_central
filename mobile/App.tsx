import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider } from './src/contexts/AuthContext';
import Navigation from './src/navigation';
import i18n, { loadSavedLanguage } from './src/i18n';

export default function App() {
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    loadSavedLanguage().then((lang) => {
      i18n.changeLanguage(lang).finally(() => setI18nReady(true));
    });
  }, []);

  if (!i18nReady) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator /></View>;
  }

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Navigation />
    </AuthProvider>
  );
}
