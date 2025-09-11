import React, { useState } from 'react';
import { View, TextInput, Button } from 'react-native';

export default function PersonForm({ onSaved }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const onSubmit = async () => {
    if (window.api?.people?.save) {
      const person = await window.api.people.save({
        first_name: firstName,
        last_name: lastName,
      });
      onSaved?.(person);
      setFirstName('');
      setLastName('');
    }
  };

  return (
    <View>
      <TextInput placeholder="First Name" value={firstName} onChangeText={setFirstName} />
      <TextInput placeholder="Last Name" value={lastName} onChangeText={setLastName} />
      <Button title="Save" onPress={onSubmit} />
    </View>
  );
}
