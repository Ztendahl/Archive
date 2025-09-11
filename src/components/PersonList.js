import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';

export default function PersonList() {
  const [people, setPeople] = useState([]);

  useEffect(() => {
    if (window.api?.people?.list) {
      window.api.people.list().then(setPeople);
    }
  }, []);

  return (
    <View>
      <FlatList
        data={people}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text>{`${item.first_name || ''} ${item.last_name || ''}`}</Text>
        )}
        ListEmptyComponent={<Text>No people yet</Text>}
      />
    </View>
  );
}
