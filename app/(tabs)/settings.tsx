import Text from '../../src/components/ui/Text';
import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import ProfileImagePicker from '../../src/components/ui/ProfileImagePicker';
import { getUserProfile, updateUserProfile, UserProfile } from '../../src/db/database';
import Background from '../../src/components/ui/Background';

export default function Settings() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [profilePicUri, setProfilePicUri] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = () => {
    try {
      const p = getUserProfile();
      if (p) {
        setProfile(p);
        setName(p.name || '');
        setProfilePicUri(p.profile_pic_uri);
      }
    } catch (e) {
      console.warn("Error loading profile", e);
    }
  };

  const handleSave = () => {
    try {
      updateUserProfile(name, profilePicUri);
      Alert.alert('Success', 'Settings saved successfully!');
    } catch (e) {
      console.error("Error saving profile", e);
      Alert.alert('Error', 'Failed to save settings.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.flex} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Background />
      <ScrollView 
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.headerTitle}>Settings</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Profile Details</Text>
          
          <ProfileImagePicker 
            initialImage={profilePicUri} 
            onImageSelected={setProfilePicUri} 
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Other Settings</Text>
          <Text style={styles.comingSoon}>More settings options (like themes, notifications) will appear here in future updates.</Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  comingSoon: {
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
  }
});
