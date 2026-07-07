import { api } from '@/src/service/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface Dispositivo {
  id: string;
  nome?: string;
  ambienteId?: string;
}

interface Ambiente {
  id: string;
  nome: string;
}

export default function DispositivosScreen() {
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [ambientesMapa, setAmbientesMapa] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  const router = useRouter();

  const fetchDispositivos = async () => {
    try {
      const [resDisp, resAmb] = await Promise.all([
        api.get<{ dispositivos: Dispositivo[] }>('/dispositivo/'),
        api.get<{ ambientes: Ambiente[] }>('/ambiente/').catch(() => ({ data: { ambientes: [] } }))
      ]);

      setDispositivos(resDisp.data.dispositivos);

      // Mapeia o ID do ambiente para o seu respectivo nome amigável
      const mapa: Record<string, string> = {};
      if (resAmb?.data?.ambientes) {
        resAmb.data.ambientes.forEach((amb) => {
          mapa[amb.id] = amb.nome;
        });
      }
      setAmbientesMapa(mapa);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar os dispositivos IoT.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDispositivos();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDispositivos();
  };

  const renderDispositivoCard = ({ item }: { item: Dispositivo }) => {
    const nomeAmbiente = item.ambienteId ? (ambientesMapa[item.ambienteId] || item.ambienteId) : null;

    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => router.push({
          pathname: '/(dashboard)/dispositivos/cadastro',
          params: { id: item.id, nome: item.nome, ambienteId: item.ambienteId }
        })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <View style={styles.iconWrapper}>
              <Ionicons name="hardware-chip" size={18} color="#4F46E5" />
            </View>
            <View style={styles.cardTitleSub}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.nome || 'Dispositivo Sem Nome'}
              </Text>
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                MAC: {item.id}
              </Text>
            </View>
          </View>
          
          {/* Badge de status ativo com indicador verde */}
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Ativo</Text>
          </View>
        </View>

        {nomeAmbiente && <View style={styles.divider} />}
        
        {nomeAmbiente && (
          <View style={styles.ambienteRow}>
            <Ionicons name="business-outline" size={14} color="#64748B" />
            <Text style={styles.ambienteText} numberOfLines={1}>
              <Text style={styles.boldLabel}>Ambiente: </Text>{nomeAmbiente}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
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
            <Ionicons name="hardware-chip-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyText}>Nenhum dispositivo encontrado.</Text>
          </View>
        }
      />

      {/* Botão Flutuante (FAB) alinhado com a nova paleta */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push('/dispositivos/cadastro')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  screenTitle: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: '#64748B', 
    paddingHorizontal: 16, 
    marginTop: 20, 
    marginBottom: 8, 
    textTransform: 'uppercase', 
    letterSpacing: 0.5 
  },
  listContent: { 
    paddingHorizontal: 16, 
    paddingBottom: 88, 
    paddingTop: 8 
  },
  card: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1 
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  titleContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1, 
    marginRight: 8 
  },
  iconWrapper: { 
    width: 36, 
    height: 36, 
    borderRadius: 10, 
    backgroundColor: '#EEF2FF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12 
  },
  cardTitleSub: { 
    flex: 1 
  },
  cardTitle: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: '#1E293B' 
  },
  cardSubtitle: { 
    fontSize: 12, 
    color: '#64748B', 
    marginTop: 2 
  },
  statusBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#D1FAE5', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6,
    gap: 5
  },
  statusDot: { 
    width: 6, 
    height: 6, 
    borderRadius: 3, 
    backgroundColor: '#10B981' 
  },
  statusText: { 
    fontSize: 10, 
    fontWeight: '800', 
    color: '#065F46', 
    letterSpacing: 0.5 
  },
  divider: { 
    height: 1, 
    backgroundColor: '#F1F5F9', 
    marginVertical: 12 
  },
  ambienteRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6,
    paddingLeft: 48 // Alinha com o início do texto do título
  },
  ambienteText: { 
    fontSize: 13, 
    color: '#475569', 
    flex: 1 
  },
  boldLabel: { 
    fontWeight: '600', 
    color: '#64748B' 
  },
  centerContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 60 
  },
  loadingText: { 
    marginTop: 12, 
    color: '#64748B', 
    fontSize: 15 
  },
  emptyText: { 
    color: '#64748B', 
    fontSize: 15, 
    textAlign: 'center', 
    marginTop: 8 
  },
  fab: { 
    position: 'absolute', 
    right: 20, 
    bottom: 20, 
    backgroundColor: '#4F46E5', 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: '#4F46E5', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 6, 
    elevation: 4 
  }
});