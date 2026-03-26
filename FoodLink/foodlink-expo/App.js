import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import our screens as regular components
import LoginScreen from './src/screens/LoginScreen';
import DonorScreen from './src/screens/DonorScreen';
import VolunteerMapScreen from './src/screens/VolunteerMapScreen';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState('Login');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const role = await AsyncStorage.getItem('userRole');
      if (token && role) {
        setCurrentScreen(role === 'donor' ? 'Donor' : 'VolunteerMap');
      } else {
        setCurrentScreen('Login');
      }
    } catch (e) {
      setCurrentScreen('Login');
    } finally {
      setIsLoading(false);
    }
  };

  // Simple navigation mockup for our custom screens
  const navigate = (screenName) => {
    setCurrentScreen(screenName);
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#0d631b" />
      </View>
    );
  }

  // Manually switch between screens based on state
  // This avoids all "Black Screen" and "Navigation Library" crashes
  return (
    <View style={{ flex: 1 }}>
      {currentScreen === 'Login' && (
        <LoginScreen 
          navigation={{ 
            replace: (name) => navigate(name),
            navigate: (name) => navigate(name)
          }} 
        />
      )}
      {currentScreen === 'Donor' && (
        <DonorScreen 
          navigation={{ 
            replace: (name) => navigate(name),
            navigate: (name) => navigate(name)
          }} 
        />
      )}
      {currentScreen === 'VolunteerMap' && (
        <VolunteerMapScreen 
          navigation={{ 
            replace: (name) => navigate(name),
            navigate: (name) => navigate(name)
          }} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f6fbf0' }
});
