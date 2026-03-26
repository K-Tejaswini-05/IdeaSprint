import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';

export default function DonorScreen({ navigation }) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [location, setLocation] = useState('');
  const [foods, setFoods] = useState([]);

  useEffect(() => {
    fetchMyFoods();
    const interval = setInterval(fetchMyFoods, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchMyFoods = async () => {
    try {
      const res = await api.get('/foods');
      setFoods(res.data);
    } catch (e) { }
  };

  const handlePost = async () => {
    if (!name || !quantity || !location) return Alert.alert('Error', 'Fill all fields');
    try {
      await api.post('/foods', { name, quantity, location });
      Alert.alert('Success', 'Food item posted!');
      setName(''); setQuantity(''); setLocation('');
      fetchMyFoods();
    } catch (err) { Alert.alert('Error', 'Failed to post food'); }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userRole');
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Donor Dashboard</Text>
        <TouchableOpacity onPress={handleLogout}><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Post New Food</Text>
        <TextInput style={styles.input} placeholder="Food Name" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Quantity (e.g., 2 boxes)" value={quantity} onChangeText={setQuantity} />
        <TextInput style={styles.input} placeholder="Pickup Location (e.g., Downtown)" value={location} onChangeText={setLocation} />
        <TouchableOpacity style={styles.primaryBtn} onPress={handlePost}>
          <Text style={styles.primaryBtnText}>Post Food</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>My Posts</Text>
      <FlatList
        data={foods}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.foodItem}>
            <View>
              <Text style={styles.foodName}>{item.name}</Text>
              <Text style={styles.foodDetails}>Qty: {item.quantity} • {item.location}</Text>
            </View>
            <Text style={[styles.statusBadge, 
              item.status === 'available' ? styles.statusAvailable : 
              item.status === 'accepted' ? styles.statusAccepted : styles.statusDelivered]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No posts yet.</Text>}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6fbf0', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingTop: 30 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#0f491c' },
  logoutText: { color: 'red', fontWeight: 'bold' },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 15, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f491c', marginBottom: 15 },
  input: { backgroundColor: '#f8fcf5', padding: 12, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  primaryBtn: { backgroundColor: '#0d631b', padding: 15, borderRadius: 30, alignItems: 'center', marginTop: 5 },
  primaryBtnText: { color: 'white', fontWeight: 'bold' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f491c', marginBottom: 10 },
  foodItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10 },
  foodName: { fontSize: 16, fontWeight: 'bold', color: '#0f491c' },
  foodDetails: { fontSize: 12, color: 'gray', marginTop: 2 },
  statusBadge: { fontSize: 10, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },
  statusAvailable: { backgroundColor: '#e0f2fe', color: '#0284c7' },
  statusAccepted: { backgroundColor: '#fef3c7', color: '#d97706' },
  statusDelivered: { backgroundColor: '#dcfce7', color: '#16a34a' },
  emptyText: { textAlign: 'center', color: 'gray', marginTop: 20 }
});
