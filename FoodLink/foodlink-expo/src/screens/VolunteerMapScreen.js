import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, FlatList } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';

const { width, height } = Dimensions.get('window');

const simpleHashCoords = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const modLat = (hash % 100) / 1000;
    const modLng = ((hash >> 5) % 100) / 1000;
    return { lat: 40.7128 + modLat, lng: -74.0060 + modLng };
};

export default function VolunteerMapScreen({ navigation }) {
  const [foods, setFoods] = useState([]);
  const [showList, setShowList] = useState(false);
  const [region, setRegion] = useState({
    latitude: 40.7128, longitude: -74.0060,
    latitudeDelta: 0.0922, longitudeDelta: 0.0421,
  });

  useEffect(() => {
    fetchFoods();
    const interval = setInterval(fetchFoods, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchFoods = async () => {
    try {
      const res = await api.get('/foods');
      setFoods(res.data);
    } catch (e) { }
  };

  const handleAccept = async (id) => {
    try {
      await api.put(`/foods/${id}/accept`);
      Alert.alert('Success', 'Accepted delivery!');
      fetchFoods();
    } catch (e) { Alert.alert('Error', 'Could not accept'); }
  };

  const handleDeliver = async (id) => {
    try {
      await api.put(`/foods/${id}/deliver`);
      Alert.alert('Success', 'Marked as delivered!');
      fetchFoods();
    } catch (e) { Alert.alert('Error', 'Could not deliver'); }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userRole');
    navigation.replace('Login');
  };

  const availableFoods = foods.filter(f => f.status === 'available');
  const acceptedFoods = foods.filter(f => f.status === 'accepted');

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={region}>
        {availableFoods.map(f => {
           const coords = simpleHashCoords(f.location + f.id);
           return (
             <Marker
               key={f.id}
               coordinate={{ latitude: coords.lat, longitude: coords.lng }}
               title={f.name}
               description={`Qty: ${f.quantity} At: ${f.location}`}
             />
           );
        })}
      </MapView>

      <View style={styles.headerOverlay}>
        <Text style={styles.headerTitle}>Volunteer Radar</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomOverlay}>
        <TouchableOpacity style={styles.toggleBtn} onPress={() => setShowList(!showList)}>
          <Text style={styles.toggleBtnText}>{showList ? 'Hide List' : 'View Operations List'}</Text>
        </TouchableOpacity>
      </View>

      {showList && (
        <View style={styles.listContainer}>
          <Text style={styles.listHeader}>Active Operations ({acceptedFoods.length})</Text>
          <FlatList
            data={acceptedFoods}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.foodCard}>
                <Text style={styles.foodName}>{item.name}</Text>
                <Text style={styles.foodDetails}>Destination: {item.location}</Text>
                <TouchableOpacity style={styles.deliverBtn} onPress={() => handleDeliver(item.id)}>
                  <Text style={styles.deliverBtnText}>Finish Delivery</Text>
                </TouchableOpacity>
              </View>
            )}
            style={{ maxHeight: height * 0.3 }}
            ListEmptyComponent={<Text style={styles.emptyText}>No active deliveries.</Text>}
          />

          <Text style={[styles.listHeader, { marginTop: 20 }]}>Available Nearby ({availableFoods.length})</Text>
          <FlatList
            data={availableFoods}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.foodCard}>
                <Text style={styles.foodName}>{item.name}</Text>
                <Text style={styles.foodDetails}>Pickup: {item.location} • Qty: {item.quantity}</Text>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleAccept(item.id)}>
                  <Text style={styles.actionBtnText}>Accept Request</Text>
                </TouchableOpacity>
              </View>
            )}
            style={{ maxHeight: height * 0.3 }}
            ListEmptyComponent={<Text style={styles.emptyText}>Nothing nearby right now.</Text>}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: width, height: height },
  headerOverlay: {
    position: 'absolute', top: 50, left: 20, right: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)', padding: 15, borderRadius: 30, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f491c' },
  logoutBtn: { backgroundColor: '#fee2e2', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  logoutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 12 },
  bottomOverlay: { position: 'absolute', bottom: 40, left: 20, right: 20 },
  toggleBtn: { backgroundColor: '#0d631b', padding: 15, borderRadius: 30, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10 },
  toggleBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  listContainer: {
    position: 'absolute', bottom: 100, left: 20, right: 20,
    backgroundColor: 'white', borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 15, elevation: 10
  },
  listHeader: { fontSize: 16, fontWeight: 'bold', color: '#0f491c', marginBottom: 10 },
  foodCard: { backgroundColor: '#f8fcf5', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  foodName: { fontSize: 16, fontWeight: 'bold', color: '#0f491c' },
  foodDetails: { fontSize: 12, color: 'gray', marginTop: 2, marginBottom: 10 },
  actionBtn: { backgroundColor: '#e5eadf', padding: 10, borderRadius: 20, alignItems: 'center' },
  actionBtnText: { color: '#0d631b', fontWeight: 'bold', fontSize: 12 },
  deliverBtn: { backgroundColor: '#f89c00', padding: 10, borderRadius: 20, alignItems: 'center' },
  deliverBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  emptyText: { color: 'gray', fontStyle: 'italic' }
});
