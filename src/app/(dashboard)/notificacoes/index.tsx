import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/src/contexts/AuthContext';
import { api } from '@/src/service/api';
import { useFocusEffect } from 'expo-router';

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
  const { userId } = useAuth();

  // Estado do Modal Customizado
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    type: 'success' | 'warning' | 'confirm';
    onConfirm: () => void;
  } | null>(null);

  const fetchNotificacoes = async () => {
    try {
      const response = await api.get<any>(`/notificacao/${userId}`);
      const listaRecebida: Notificacao[] = response.data.notificoes || [];
      
      const alertasAtivos = listaRecebida.filter(n => !n.lida);
      alertasAtivos.sort((a, b) => (a.nivel === 'critico' ? -1 : 1));
      
      setNotificacoes(alertasAtivos);
    } catch (error) {
      console.error("Erro na API de notificações:", error);
      setModalConfig({
        title: 'Erro',
        message: 'Não foi possível carregar os alertas do armazém.',
        type: 'warning',
        onConfirm: () => {}
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotificacoes();

      const interval = setInterval(() => {
        fetchNotificacoes();
      }, 5000);

      return () => clearInterval(interval);
    }, [userId])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotificacoes();
  };

  const marcarComoLida = async (notificacaoId: string) => {
    try {
      setNotificacoes(prev => prev.filter(n => n.id !== notificacaoId));
      await api.post('/notificacao/', { notificacaoId });
      
      setModalConfig({
        title: 'Alerta Resolvido',
        message: 'A anomalia foi marcada como resolvida com sucesso!',
        type: 'success',
        onConfirm: () => {}
      });
    } catch (error) {
      setModalConfig({
        title: 'Erro',
        message: 'Não foi possível atualizar o status da notificação.',
        type: 'warning',
        onConfirm: () => {}
      });
      fetchNotificacoes();
    }
  };

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
            <Text style={styles.confrontoLabel}>Limite Recomendado</Text>
            <Text style={styles.confrontoValorLimite}>
              {item.limiteMin}{unidade} a {item.limiteMax}{unidade}
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
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Buscando alertas de anomalia...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
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
              <Ionicons name="checkmark-circle-outline" size={48} color="#10B981" />
              <Text style={styles.emptyText}>Tudo seguro no armazém</Text>
              <Text style={styles.emptySubText}>Nenhuma anomalia crítica detectada.</Text>
            </View>
          }
        />
      </View>

      {/* MODAL DIALOG CUSTOMIZADO (ALERT E CONFIRM PREMIUM) */}
      <Modal
        transparent
        visible={!!modalConfig}
        animationType="fade"
        onRequestClose={() => setModalConfig(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[
              styles.modalIconBg, 
              modalConfig?.type === 'success' ? styles.iconBgSuccess : 
              modalConfig?.type === 'confirm' ? styles.iconBgDanger : 
              styles.iconBgWarning
            ]}>
              <Ionicons 
                name={
                  modalConfig?.type === 'success' ? 'checkmark-circle-outline' : 
                  modalConfig?.type === 'confirm' ? 'trash-outline' : 
                  'warning-outline'
                } 
                size={28} 
                color={
                  modalConfig?.type === 'success' ? '#10B981' : 
                  modalConfig?.type === 'confirm' ? '#EF4444' : 
                  '#F59E0B'
                } 
              />
            </View>
            
            <Text style={styles.modalTitle}>{modalConfig?.title}</Text>
            <Text style={styles.modalMessage}>{modalConfig?.message}</Text>
            
            <View style={styles.modalButtonsRow}>
              {modalConfig?.type === 'confirm' && (
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonCancel]} 
                  onPress={() => setModalConfig(null)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[
                  styles.modalButton, 
                  modalConfig?.type === 'confirm' ? styles.modalButtonConfirmDelete : styles.modalButtonConfirm
                ]} 
                onPress={() => {
                  const action = modalConfig?.onConfirm;
                  setModalConfig(null);
                  if (action) action();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonTextConfirm}>
                  {modalConfig?.type === 'confirm' ? 'Confirmar' : 'OK'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingTop: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  cardCritico: {
    borderColor: '#FCA5A5', // Vermelho suave
    backgroundColor: '#FFF8F8'
  },
  cardAviso: {
    borderColor: '#FDE68A', // Laranja/Amarelo suave
    backgroundColor: '#FFFDF5'
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
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5
  },
  badgeCritico: {
    backgroundColor: '#EF4444',
  },
  badgeAviso: {
    backgroundColor: '#F59E0B',
  },
  sensorTipo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  mensagem: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
    lineHeight: 20
  },
  confrontoContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
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
    height: 30,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  confrontoLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  confrontoValor: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  confrontoValorLimite: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  textoCritico: {
    color: '#EF4444',
  },
  btnLer: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnLerText: {
    color: '#4F46E5',
    fontWeight: '700',
    fontSize: 14,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 15,
  },
  emptyText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12
  },
  emptySubText: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 4,
  },

  // Estilos do Modal Customizado
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8
  },
  modalIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  iconBgSuccess: {
    backgroundColor: '#D1FAE5'
  },
  iconBgDanger: {
    backgroundColor: '#FEF2F2'
  },
  iconBgWarning: {
    backgroundColor: '#FEF3C7'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center'
  },
  modalMessage: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%'
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 46
  },
  modalButtonCancel: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  modalButtonConfirm: {
    backgroundColor: '#4F46E5'
  },
  modalButtonConfirmDelete: {
    backgroundColor: '#EF4444'
  },
  modalButtonTextCancel: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600'
  },
  modalButtonTextConfirm: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600'
  }
});