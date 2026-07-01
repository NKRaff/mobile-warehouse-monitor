import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Ajuste no caminho do import da API que agora está em src/
import { api } from '@/src/service/api';
import { useRouter } from 'expo-router';

interface Ambiente {
  id: string;
  nome: string;
  tipo: string;
  descricao: string;
}

export default function AmbienteScreen() {
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const router = useRouter()

  const fetchAmbientes = async () => {
    try {
      const response = await api.get<{ ambientes: Ambiente[] }>('/ambiente/');
      setAmbientes(response.data.ambientes);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar os ambientes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAmbientes();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAmbientes();
  };

  const renderAmbienteCard = ({ item }: { item: Ambiente }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.nome}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.tipo.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.cardDescription}>{item.descricao}</Text>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Buscando ambientes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Ambientes Monitorados</Text>
      <FlatList
        data={ambientes}
        keyExtractor={(item) => item.id}
        renderItem={renderAmbienteCard}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>Nenhum ambiente encontrado.</Text>
          </View>
        }
      />
      <TouchableOpacity 
          style={styles.fab} 
          onPress={() => router.push('/ambientes/cadastro')} // Caminho baseado nas pastas
        >
          <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', paddingTop: 16 },
  screenTitle: { fontSize: 22, fontWeight: 'bold', color: '#212529', paddingHorizontal: 16, marginBottom: 16 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E9ECEF', elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#343A40', flex: 1, marginRight: 8 },
  badge: { backgroundColor: '#E7F5FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#007BFF', fontSize: 11, fontWeight: 'bold' },
  cardDescription: { fontSize: 14, color: '#6C757D', lineHeight: 20 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 12, color: '#6C757D', fontSize: 16 },
  emptyText: { color: '#6C757D', fontSize: 16, textAlign: 'center' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#007BFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  fabText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' }
});