import React, { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import PersonList from './components/PersonList.js';
import PersonForm from './components/PersonForm.js';

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  return (
    <SafeAreaView style={styles.container}>
      <PersonForm onSaved={refresh} />
      <PersonList key={refreshKey} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
});
