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

// Substitua pelo caminho real da sua configuração do axios
import { useAuth } from '@/src/contexts/AuthContext';
import { api } from '@/src/service/api';

// Tipagem baseada no seu contrato de API
interface Notificacao {
  id: string;
  dispositivoId: string;
  ambienteId: string;
  tipo: string;
  nivel: 'aviso' | 'critico'; 
  mensagem: string;
  sensorTipo: 'temperatura' | 'umidade';
  valorAtual: number;
  limiteMin: number;
  limiteMax: number;
  lida: boolean;
}

export default function NotificacoesScreen() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Mock de ID do usuário logado (Idealmente viria do seu Context/Auth)
  const { userId } = useAuth();

  const fetchNotificacoes = async () => {
    try {
      // Usamos 'any' temporariamente na tipagem da resposta para lidar com a incerteza do backend
      const response = await api.get<any>(`/notificacao/${userId}`);
      
      // Mapeia de forma segura: pega 'notificacoes', ou 'notificoes' (typo), ou um array vazio por padrão
      const listaRecebida: Notificacao[] = response.data.notificoes;
      
      // Agora o .filter é totalmente seguro, pois listaRecebida sempre será um Array
      const alertasAtivos = listaRecebida.filter(n => !n.lida);
      
      // Ordena colocando os "críticos" primeiro
      alertasAtivos.sort((a, b) => (a.nivel === 'critico' ? -1 : 1));
      
      setNotificacoes(alertasAtivos);
    } catch (error) {
      console.error("Erro na API de notificações:", error);
      Alert.alert('Erro', 'Não foi possível carregar os alertas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotificacoes();

    const interval = setInterval(() => {
      fetchNotificacoes();
    }, 5000);

    return () => clearInterval(interval);
  }, [userId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotificacoes();
  };

  // 2. Ação de marcar como lida
  const marcarComoLida = async (notificacaoId: string) => {
    try {
      // Remove da interface imediatamente para UX mais fluida (Optimistic Update)
      setNotificacoes(prev => prev.filter(n => n.id !== notificacaoId));
      
      // Avisa o backend
      await api.post('/notificacao/', { notificacaoId });
    } catch (error) {
      // Se falhar, recarrega a lista original
      Alert.alert('Erro', 'Não foi possível atualizar o status da notificação.');
      fetchNotificacoes();
    }
  };

  // 3. Renderização do Card (Painel de Criticidade e Confronto)
  const renderCard = ({ item }: { item: Notificacao }) => {
    const isCritico = item.nivel === 'critico';
    const isTemperatura = item.sensorTipo === 'temperatura';
    const unidade = isTemperatura ? '°C' : '%';

    return (
      <View style={[styles.card, isCritico ? styles.cardCritico : styles.cardAviso]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.badge, isCritico ? styles.badgeCritico : styles.badgeAviso]}>
            {item.nivel.toUpperCase()}
          </Text>
          <Text style={styles.sensorTipo}>
            {isTemperatura ? '🌡️ Temperatura' : '💧 Umidade'}
          </Text>
        </View>

        <Text style={styles.mensagem}>{item.mensagem}</Text>

        {/* Dados de Confronto */}
        <View style={styles.confrontoContainer}>
          <View style={styles.confrontoItem}>
            <Text style={styles.confrontoLabel}>Atual</Text>
            <Text style={[styles.confrontoValor, isCritico && styles.textoCritico]}>
              {item.valorAtual}{unidade}
            </Text>
          </View>
          <View style={styles.confrontoDivider} />
          <View style={styles.confrontoItem}>
            <Text style={styles.confrontoLabel}>Limite Permitido</Text>
            <Text style={styles.confrontoValorLimite}>
              Min {item.limiteMin}{unidade} ~ Max {item.limiteMax}{unidade}
            </Text>
          </View>
        </View>

        {/* Botão de Ação */}
        <TouchableOpacity 
          style={styles.btnLer} 
          onPress={() => marcarComoLida(item.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.btnLerText}>✓ Marcar como Resolvido</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#DC3545" />
        <Text style={styles.loadingText}>Buscando alertas de anomalia...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>       
      <FlatList
        data={notificacoes}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>✅ Tudo seguro no armazém.</Text>
            <Text style={styles.emptySubText}>Nenhuma anomalia detectada.</Text>
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
    paddingTop: 16,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212529',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardCritico: {
    borderColor: '#DC3545', // Vermelho (Perigo)
  },
  cardAviso: {
    borderColor: '#FD7E14', // Laranja (Atenção)
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  badgeCritico: {
    backgroundColor: '#DC3545',
  },
  badgeAviso: {
    backgroundColor: '#FD7E14',
  },
  sensorTipo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  mensagem: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
    marginBottom: 16,
  },
  confrontoContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F3F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  confrontoItem: {
    flex: 1,
    alignItems: 'center',
  },
  confrontoDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#CED4DA',
    marginHorizontal: 8,
  },
  confrontoLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
  },
  confrontoValor: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  confrontoValorLimite: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  textoCritico: {
    color: '#DC3545',
  },
  btnLer: {
    backgroundColor: '#E9ECEF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnLerText: {
    color: '#495057',
    fontWeight: 'bold',
    fontSize: 15,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    color: '#6C757D',
    fontSize: 16,
  },
  emptyText: {
    color: '#28A745',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptySubText: {
    color: '#6C757D',
    fontSize: 15,
    marginTop: 4,
  },
});