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

// Importa a instância do Axios (ajuste o caminho se sua estrutura for um pouco diferente)
import { api } from '@/src/service/api';

// Definição da interface baseada no seu endpoint
interface Dispositivo {
  id: string;
  nome?: string;
  ambienteId?: string;
}

export default function DispositivosScreen() {
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Função para buscar os dispositivos da API
  const fetchDispositivos = async () => {
    try {
      // Faz o GET mapeando o formato de resposta { dispositivos: [...] }
      const response = await api.get<{ dispositivos: Dispositivo[] }>('/dispositivo/');
      setDispositivos(response.data.dispositivos);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar os dispositivos IoT.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Busca os dados assim que a tela monta
  useEffect(() => {
    fetchDispositivos();
  }, []);

  // Função executada ao arrastar a lista para baixo
  const handleRefresh = () => {
    setRefreshing(true);
    fetchDispositivos();
  };

  // Renderização de cada card de dispositivo
  const renderDispositivoCard = ({ item }: { item: Dispositivo }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        {/* Fallback caso o nome venha nulo ou opcional */}
        <Text style={styles.cardTitle}>
          {item.nome || 'Dispositivo Sem Nome'}
        </Text>
        <View style={styles.statusDot} />
      </View>
      
      <Text style={styles.cardText}>
        <Text style={styles.boldLabel}>ID: </Text>{item.id}
      </Text>
      
      {item.ambienteId && (
        <Text style={styles.cardText}>
          <Text style={styles.boldLabel}>Ambiente ID: </Text>{item.ambienteId}
        </Text>
      )}
    </TouchableOpacity>
  );

  // Tela de carregamento inicial
  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Buscando dispositivos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Hardware & Sensores</Text>
      
      <FlatList
        data={dispositivos}
        keyExtractor={(item) => item.id}
        renderItem={renderDispositivoCard}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>Nenhum dispositivo encontrado.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA', 
    paddingTop: 16 
  },
  screenTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#212529', 
    paddingHorizontal: 16, 
    marginBottom: 16 
  },
  listContent: { 
    paddingHorizontal: 16, 
    paddingBottom: 24 
  },
  card: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#E9ECEF', 
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  cardTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#343A40', 
    flex: 1, 
    marginRight: 8 
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#28A745', // Verde indicando "Online/Ativo"
  },
  cardText: { 
    fontSize: 13, 
    color: '#6C757D', 
    marginTop: 4 
  },
  boldLabel: {
    fontWeight: '600',
    color: '#495057'
  },
  centerContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 40 
  },
  loadingText: { 
    marginTop: 12, 
    color: '#6C757D', 
    fontSize: 16 
  },
  emptyText: { 
    color: '#6C757D', 
    fontSize: 16, 
    textAlign: 'center' 
  },
});