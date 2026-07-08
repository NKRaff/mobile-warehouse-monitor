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

interface Ambiente {
  id: string;
  nome: string;
  tipo: 'frio' | 'arejado' | string;
  descricao: string;
  temperatura_minima: number;
  temperatura_maxima: number;
  umidade_minima: number;
  umidade_maxima: number;
}

interface Medicao {
  id: string;
  dispositivoId: string;
  ambienteId: string;
  tipo: 'temperatura' | 'umidade';
  valor: number;
  createdAt: string;
}

interface TelemetriaAmbiente {
  temperatura?: number;
  umidade?: number;
}

export default function AmbienteScreen() {
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [telemetrias, setTelemetrias] = useState<Record<string, TelemetriaAmbiente>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const router = useRouter();

  const fetchAmbientes = async () => {
    try {
      const response = await api.get<{ ambientes: Ambiente[] }>('/ambiente/');
      const listaAmbientes = response.data.ambientes;
      setAmbientes(listaAmbientes);

      // Busca a última telemetria (temperatura e umidade) de cada ambiente em paralelo
      const promessas = listaAmbientes.map(async (amb) => {
        try {
          const [resTemp, resUmi] = await Promise.all([
            api.post<Medicao>('/medicao/buscar-ultima', { ambienteId: amb.id, tipo: 'temperatura' }).catch(() => null),
            api.post<Medicao>('/medicao/buscar-ultima', { ambienteId: amb.id, tipo: 'umidade' }).catch(() => null)
          ]);
          return {
            id: amb.id,
            temperatura: resTemp?.data?.valor,
            umidade: resUmi?.data?.valor
          };
        } catch (err) {
          console.error(`Erro ao carregar telemetria do ambiente ${amb.nome}:`, err);
          return { id: amb.id };
        }
      });

      const resultados = await Promise.all(promessas);
      const novoMapaTelemetria: Record<string, TelemetriaAmbiente> = {};
      resultados.forEach((res) => {
        novoMapaTelemetria[res.id] = {
          temperatura: res.temperatura,
          umidade: res.umidade
        };
      });
      setTelemetrias(novoMapaTelemetria);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar os ambientes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAmbientes();

      const interval = setInterval(() => {
        fetchAmbientes();
      }, 5000);

      return () => clearInterval(interval);
    }, [ambientes])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAmbientes();
  };

  // Contagem de ambientes críticos
  const numAmbientes = ambientes.length;
  let numCriticos = 0;

  ambientes.forEach((item) => {
    const telemetry = telemetrias[item.id];
    if (telemetry) {
      const tempVal = telemetry.temperatura;
      const umiVal = telemetry.umidade;
      const tempIsSafe = tempVal !== undefined ? (tempVal >= item.temperatura_minima && tempVal <= item.temperatura_maxima) : true;
      const umiIsSafe = umiVal !== undefined ? (umiVal >= item.umidade_minima && umiVal <= item.umidade_maxima) : true;
      if (!tempIsSafe || !umiIsSafe) {
        numCriticos++;
      }
    }
  });

  let statusText = 'Sincronizando dados...';
  let statusColor = '#4B5563'; // Slate
  let statusBg = '#E2E8F0';

  if (!loading || refreshing) {
    if (numAmbientes === 0) {
      statusText = 'Nenhum ambiente encontrado';
    } else if (numCriticos > 0) {
      statusText = `${numCriticos} ambiente${numCriticos > 1 ? 's' : ''} fora dos limites recomendado!`;
      statusColor = '#EF4444'; // Red
      statusBg = '#FEE2E2';
    } else {
      statusText = 'Todos os ambientes estão normais';
      statusColor = '#10B981'; // Emerald Green
      statusBg = '#D1FAE5';
    }
  }

  const renderAmbienteCard = ({ item }: { item: Ambiente }) => {
    const isFrio = item.tipo.toLowerCase() === 'frio';
    const telemetry = telemetrias[item.id];
    const tempVal = telemetry?.temperatura;
    const umiVal = telemetry?.umidade;
    
    const tempIsSafe = tempVal !== undefined ? (tempVal >= item.temperatura_minima && tempVal <= item.temperatura_maxima) : true;
    const umiIsSafe = umiVal !== undefined ? (umiVal >= item.umidade_minima && umiVal <= item.umidade_maxima) : true;
    const isSafe = tempIsSafe && umiIsSafe;

    // Ícones e cores do indicador visual do tipo de ambiente (neutro)
    let typeIcon = 'thermometer-outline';
    let typeColor = '#64748B';
    let typeBg = '#F1F5F9';

    if (isFrio) {
      typeIcon = 'snow-outline';
      typeColor = '#0284C7';
      typeBg = '#E0F2FE';
    } else if (item.tipo.toLowerCase() === 'arejado') {
      typeIcon = 'leaf-outline';
      typeColor = '#10B981';
      typeBg = '#E6F4EA';
    }

    return (
      <TouchableOpacity 
        style={[styles.card, !isSafe && styles.cardDanger]}
        activeOpacity={0.7}
        onPress={() => router.push({
          pathname: `/(dashboard)/ambientes/[id]`,
          params: { 
            id: item.id, 
            nome: item.nome, 
            tipo: item.tipo,
            descricao: item.descricao,
            temperatura_minima: item.temperatura_minima,
            temperatura_maxima: item.temperatura_maxima,
            umidade_minima: item.umidade_minima,
            umidade_maxima: item.umidade_maxima,
          }
        })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <View style={[styles.iconWrapper, { backgroundColor: typeBg }]}>
              <Ionicons name={typeIcon as any} size={18} color={typeColor} />
            </View>
            <View style={styles.cardTitleSub}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.nome}</Text>
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                Tipo: {item.tipo.toUpperCase()}{item.descricao ? ` • ${item.descricao}` : ''}
              </Text>
            </View>
          </View>
          
          {/* Badge de status real (Ideal vs Crítico) */}
          <View style={[styles.statusBadge, isSafe ? styles.badgeIdeal : styles.badgeCritico]}>
            <Text style={[styles.statusBadgeText, isSafe ? styles.textIdeal : styles.textCritico]}>
              {isSafe ? 'IDEAL' : 'CRÍTICO'}
            </Text>
          </View>
        </View>

        {/* Métrica simplificada na linha inferior */}
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Ionicons name="thermometer-outline" size={14} color={tempIsSafe ? "#64748B" : "#EF4444"} />
            <Text style={[styles.metricText, !tempIsSafe && styles.textCritical]}>
              {tempVal !== undefined ? `${tempVal}°C` : '--'}
            </Text>
          </View>
          
          <View style={styles.metricItem}>
            <Ionicons name="water-outline" size={14} color={umiIsSafe ? "#64748B" : "#EF4444"} />
            <Text style={[styles.metricText, !umiIsSafe && styles.textCritical]}>
              {umiVal !== undefined ? `${umiVal}%` : '--'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Banner de status consolidado fixo no topo da página */}
      <View style={[styles.statusSummaryContainer, { backgroundColor: statusBg }]}>
        <Ionicons 
          name={numCriticos > 0 ? "warning" : numAmbientes === 0 ? "information-circle" : "checkmark-circle"} 
          size={16} 
          color={statusColor} 
        />
        <Text style={[styles.statusSummaryText, { color: statusColor }]}>
          {statusText}
        </Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Conectando aos sensores...</Text>
        </View>
      ) : (
        <FlatList
          data={ambientes}
          keyExtractor={(item) => item.id}
          renderItem={renderAmbienteCard}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Ionicons name="file-tray-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyText}>Nenhum ambiente encontrado.</Text>
            </View>
          }
        />
      )}

      {/* FAB Botão */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push('/ambientes/cadastro')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  statusSummaryContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderRadius: 12, 
    gap: 8, 
    marginTop: 16,
    marginHorizontal: 16,
  },
  statusSummaryText: { 
    fontSize: 13, 
    fontWeight: '700' 
  },
  listContent: { 
    paddingHorizontal: 16, 
    paddingBottom: 88, 
    paddingTop: 12 
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
  cardDanger: { 
    borderColor: '#FEE2E2', 
    backgroundColor: '#FFFDFD' 
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
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6 
  },
  badgeIdeal: {
    backgroundColor: '#D1FAE5'
  },
  badgeCritico: {
    backgroundColor: '#FEE2E2'
  },
  statusBadgeText: { 
    fontSize: 10, 
    fontWeight: '800', 
    letterSpacing: 0.5 
  },
  textIdeal: {
    color: '#065F46'
  },
  textCritico: {
    color: '#EF4444'
  },
  metricsRow: { 
    flexDirection: 'row', 
    marginTop: 12,
    gap: 16,
    paddingLeft: 48 // Alinha com o início do texto do título
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  metricText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569'
  },
  textCritical: {
    color: '#EF4444',
    fontWeight: '700'
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