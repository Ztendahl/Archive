import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import PersonList from './components/PersonList';
import PersonForm from './components/PersonForm';
import { ensurePeopleApi } from './web/people';

export default function App(): React.JSX.Element {
  const [refreshKey, setRefreshKey] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ensurePeopleApi().then(() => setReady(true));
  }, []);

  const refresh = () => setRefreshKey((k) => k + 1);

  if (!ready) {
    return <SafeAreaView style={styles.container} />;
  }

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
