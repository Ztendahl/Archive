import React, { useState } from 'react';
import { View, TextInput, Button } from 'react-native';
import type { Person } from '../db/people.mapper';

interface PersonFormProps {
  onSaved?: (person: Person) => void;
}

export default function PersonForm({ onSaved }: PersonFormProps): React.JSX.Element {
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');

  const onSubmit = async () => {
    if (window.api?.people?.save) {
      const person = await window.api.people.save({
        firstName,
        lastName,
      });
      onSaved?.(person);
      setFirstName('');
      setLastName('');
    } else {
      console.warn('window.api.people is not available; ensure ensurePeopleApi() has run.');
    }
  };

  return (
    <View>
      <TextInput
        placeholder="First Name"
        testID="firstName"
        accessibilityLabel="First Name"
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        placeholder="Last Name"
        testID="lastName"
        accessibilityLabel="Last Name"
        value={lastName}
        onChangeText={setLastName}
      />
      <Button title="Save" onPress={onSubmit} />
    </View>
  );
}
