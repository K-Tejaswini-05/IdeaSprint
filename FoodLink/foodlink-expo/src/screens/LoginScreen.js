import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('donor');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill all fields');
    try {
      const endpoint = isRegistering ? '/auth/register' : '/auth/login';
      const payload = isRegistering ? { email, password, role } : { email, password };
      
      const res = await api.post(endpoint, payload);
      const { token, role: userRole } = res.data;
      
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userRole', userRole);
      
      navigation.replace(userRole === 'donor' ? 'Donor' : 'VolunteerMap');
    } catch (err) {
      Alert.alert('Auth Error', err.response?.data?.error || err.message);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>FoodLink</Text>
        
        <View style={styles.card}>
          <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"/>
          <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry/>
          
          {isRegistering && (
            <View style={styles.roleContainer}>
              <TouchableOpacity style={[styles.roleBtn, role === 'donor' && styles.roleActive]} onPress={() => setRole('donor')}>
                <Text style={role === 'donor' ? styles.roleTextActive : styles.roleText}>Donor</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.roleBtn, role === 'volunteer' && styles.roleActive]} onPress={() => setRole('volunteer')}>
                <Text style={role === 'volunteer' ? styles.roleTextActive : styles.roleText}>Volunteer</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <TouchableOpacity style={styles.primaryBtn} onPress={handleAuth}>
            <Text style={styles.primaryBtnText}>{isRegistering ? 'Register' : 'Login'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
            <Text style={styles.toggleText}>
              {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6fbf0' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#0f491c', textAlign: 'center', marginBottom: 40 },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  input: { backgroundColor: '#f8fcf5', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
  roleContainer: { flexDirection: 'row', marginBottom: 15 },
  roleBtn: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 10, backgroundColor: '#e5eadf', marginHorizontal: 5 },
  roleActive: { backgroundColor: '#0d631b' },
  roleText: { color: '#40493d', fontWeight: 'bold' },
  roleTextActive: { color: 'white', fontWeight: 'bold' },
  primaryBtn: { backgroundColor: '#0d631b', padding: 15, borderRadius: 30, alignItems: 'center', marginTop: 10 },
  primaryBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  toggleText: { color: '#0d631b', textAlign: 'center', marginTop: 20, fontWeight: 'bold' }
});
