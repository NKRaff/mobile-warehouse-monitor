import { api } from '@/src/service/api';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  DimensionValue,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface Medicao {
  id: string;
  dispositivoId: string;
  ambienteId: string;
  tipo: 'temperatura' | 'umidade';
  valor: number;
  createdAt: string;
}

export default function DetalhesAmbienteScreen() {
  const { 
    id, nome, tipo, descricao, 
    temperatura_minima, temperatura_maxima, 
    umidade_minima, umidade_maxima 
  } = useLocalSearchParams<{ 
    id: string; nome: string; tipo: string; descricao: string;
    temperatura_minima: string; temperatura_maxima: string;
    umidade_minima: string; umidade_maxima: string;
  }>();

  const [tempAtual, setTempAtual] = useState<Medicao | null>(null);
  const [umiAtual, setUmiAtual] = useState<Medicao | null>(null);
  const [historico, setHistorico] = useState<Medicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Alteração 1: Pegando os limites configurados dinamicamente com fallback caso venham indefinidos
  const limites = {
    tempMin: temperatura_minima ? parseFloat(temperatura_minima) : 0,
    tempMax: temperatura_maxima ? parseFloat(temperatura_maxima) : 40,
    umiMin: umidade_minima ? parseFloat(umidade_minima) : 0,
    umiMax: umidade_maxima ? parseFloat(umidade_maxima) : 100,
  };

  const fetchTelemetria = async () => {
    try {
      const [resTemp, resUmi, resHistorico] = await Promise.all([
        api.post<Medicao>('/medicao/buscar-ultima', { ambienteId: id, tipo: 'temperatura' }).catch(() => null),
        api.post<Medicao>('/medicao/buscar-ultima', { ambienteId: id, tipo: 'umidade' }).catch(() => null),
        api.post<{ medicoes: Medicao[] }>('/medicao/buscar', { 
          ambienteId: id, 
          startData: new Date(Date.now() - 4 * 60 * 60 * 1000) 
        }).catch(() => ({ data: { medicoes: [] } }))
      ]);

      if (resTemp) setTempAtual(resTemp.data);
      if (resUmi) setUmiAtual(resUmi.data);
      if (resHistorico) {
        const ordenado = resHistorico.data.medicoes.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setHistorico(ordenado);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Falha ao atualizar dados de telemetria.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTelemetria();
  }, [tempAtual, umiAtual]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTelemetria();
  };

  const handleDeletar = () => {
    Alert.alert(
      'Remover Setor',
      `Tem certeza que deseja excluir o ambiente "${nome}"? Dispositivos vinculados ficarão sem setor.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, Excluir',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await api.delete(`/ambiente/${id}`);
              Alert.alert('Sucesso', 'Ambiente removido do sistema.');
              router.replace('/ambientes');
            } catch (error) {
              console.error(error);
              Alert.alert('Erro', 'Não foi possível deletar este ambiente.');
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  const isTempSegura = tempAtual ? (tempAtual.valor >= limites.tempMin && tempAtual.valor <= limites.tempMax) : true;
  const isUmiSegura = umiAtual ? (umiAtual.valor >= limites.umiMin && umiAtual.valor <= limites.umiMax) : true;

  // Alteração 2: Separando os históricos por tipo de medição (Limitado a 5 de cada tipo)
  const historicoTemp = historico.filter(m => m.tipo === 'temperatura').slice(0, 5);
  const historicoUmi = historico.filter(m => m.tipo === 'umidade').slice(0, 5);

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Conectando aos sensores...</Text>
      </View>
    );
  }

  // Função auxiliar para renderizar as linhas estilizadas do gráfico
  const renderGraficoLinha = (medicao: Medicao) => {
    const ehTemp = medicao.tipo === 'temperatura';
    
    // Define a regra e limites para coloração dinâmica da barra individual
    const minLimite = ehTemp ? limites.tempMin : limites.umiMin;
    const maxLimite = ehTemp ? limites.tempMax : limites.umiMax;
    const foraDoLimite = medicao.valor < minLimite || medicao.valor > maxLimite;

    // Cálculo proporcional do preenchimento da barra baseado em um teto prático
    const valorMaximoRegua = ehTemp ? Math.max(limites.tempMax * 1.3, 40) : 100;
    const preenchimentoBarra = `${Math.min((Math.max(medicao.valor, 0) / valorMaximoRegua) * 100, 100)}%` as DimensionValue;    
    const horaFormatada = new Date(medicao.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Cores baseadas no status da medição histórica individual
    let corBarra = ehTemp ? '#007BFF' : '#20B2AA';
    if (foraDoLimite) corBarra = '#DC3545';

    return (
      <View key={medicao.id} style={styles.graficoLinha}>
        <Text style={styles.graficoHora}>{horaFormatada}</Text>
        <View style={styles.graficoBarraBackground}>
          <View style={[styles.graficoBarraPreenchida, { width: preenchimentoBarra, backgroundColor: corBarra }]} />
        </View>
        <Text style={[styles.graficoValor, foraDoLimite && styles.textInseguro]}>
          {medicao.valor}{ehTemp ? '°C' : '%'}
        </Text>
      </View>
    );
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.title} numberOfLines={2}>{nome}</Text>
            {descricao ? <Text style={styles.descriptionText}>{descricao}</Text> : null}
            <Text style={styles.subtitle}>ID: {id}</Text>
          </View>

          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={styles.btnAcao}
              onPress={() => router.push({
                pathname: '/ambientes/cadastro',
                params: { 
                  id, nome, tipo, descricao, 
                  temperatura_minima, temperatura_maxima, 
                  umidade_minima, umidade_maxima 
                } 
              })}
            >
              <Ionicons name="pencil" size={18} color="#007BFF" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.btnAcao, styles.btnDeletar]}
              onPress={handleDeletar}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#DC3545" />
              ) : (
                <Ionicons name="trash-outline" size={18} color="#DC3545" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Telemetria Atual</Text>
      <View style={styles.row}>
        <View style={[styles.telemetriaCard, isTempSegura ? styles.borderSeguro : styles.borderInseguro]}>
          <View style={styles.cardTop}>
            <Ionicons name="thermometer" size={22} color={isTempSegura ? "#28A745" : "#DC3545"} />
            <View style={[styles.statusBadge, isTempSegura ? styles.badgeSeguro : styles.badgeInseguro]}>
              <Text style={[styles.statusText, isTempSegura ? styles.textSeguro : styles.textInseguro]}>
                {isTempSegura ? "Ideal" : "Crítico"}
              </Text>
            </View>
          </View>
          <Text style={styles.valorPrincipal}>{tempAtual ? `${tempAtual.valor}°C` : '--'}</Text>
          <Text style={styles.legendaLimite}>Ideal: {limites.tempMin}°C a {limites.tempMax}°C</Text>
        </View>

        <View style={[styles.telemetriaCard, isUmiSegura ? styles.borderSeguro : styles.borderInseguro]}>
          <View style={styles.cardTop}>
            <Ionicons name="water" size={22} color={isUmiSegura ? "#28A745" : "#DC3545"} />
            <View style={[styles.statusBadge, isUmiSegura ? styles.badgeSeguro : styles.badgeInseguro]}>
              <Text style={[styles.statusText, isUmiSegura ? styles.textSeguro : styles.textInseguro]}>
                {isUmiSegura ? "Ideal" : "Crítico"}
              </Text>
            </View>
          </View>
          <Text style={styles.valorPrincipal}>{umiAtual ? `${umiAtual.valor}%` : '--'}</Text>
          <Text style={styles.legendaLimite}>Ideal: {limites.umiMin}% a {limites.umiMax}%</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Histórico e Tendências</Text>
      
      {/* Alteração 3: Blocos separados de histórico visual */}
      <View style={styles.graficoContainer}>
        <View style={styles.subSectionHeader}>
          <Ionicons name="thermometer-outline" size={16} color="#007BFF" />
          <Text style={styles.subSectionTitle}>Temperatura Recente</Text>
        </View>
        {historicoTemp.length === 0 ? (
          <Text style={styles.emptyGraphText}>Nenhuma leitura de temperatura registrada.</Text>
        ) : (
          historicoTemp.map(renderGraficoLinha)
        )}

        <View style={[styles.subSectionHeader, { marginTop: 24 }]}>
          <Ionicons name="water-outline" size={16} color="#20B2AA" />
          <Text style={styles.subSectionTitle}>Umidade Recente</Text>
        </View>
        {historicoUmi.length === 0 ? (
          <Text style={styles.emptyGraphText}>Nenhuma leitura de umidade registrada.</Text>
        ) : (
          historicoUmi.map(renderGraficoLinha)
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  loadingText: { marginTop: 12, color: '#6C757D', fontSize: 15 },
  header: { marginBottom: 20, backgroundColor: '#FFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E9ECEF', elevation: 1 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#212529' },
  descriptionText: { fontSize: 14, color: '#495057', marginTop: 6, lineHeight: 18 },
  subtitle: { fontSize: 12, color: '#ADB5BD', marginTop: 8, fontFamily: 'monospace' },
  actionButtonsContainer: { flexDirection: 'row', gap: 8 },
  btnAcao: { width: 38, height: 38, borderRadius: 8, backgroundColor: '#E7F1FF', borderWidth: 1, borderColor: '#B6D4FE', justifyContent: 'center', alignItems: 'center' },
  btnDeletar: { backgroundColor: '#F8D7DA', borderColor: '#F5C2C7' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#495057', marginBottom: 12, marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  telemetriaCard: { flex: 0.48, backgroundColor: '#FFF', borderRadius: 12, padding: 14, borderWidth: 1.5, elevation: 1 },
  borderSeguro: { borderColor: '#A3E635' },
  borderInseguro: { borderColor: '#FCA5A5' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeSeguro: { backgroundColor: '#DCFCE7' },
  badgeInseguro: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  textSeguro: { color: '#166534' },
  textInseguro: { color: '#991B1B' },
  valorPrincipal: { fontSize: 34, fontWeight: 'bold', color: '#1F2937', marginVertical: 2 },
  legendaLimite: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  graficoContainer: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  subSectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 6 },
  subSectionTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginLeft: 6 },
  emptyGraphText: { color: '#9CA3AF', textAlign: 'center', paddingVertical: 14, fontSize: 13 },
  graficoLinha: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  graficoHora: { width: 45, fontSize: 12, color: '#6B7280', fontWeight: '500' },
  graficoBarraBackground: { flex: 1, height: 10, backgroundColor: '#F3F4F6', borderRadius: 5, marginHorizontal: 12, overflow: 'hidden' },
  graficoBarraPreenchida: { height: '100%', borderRadius: 5 },
  graficoValor: { width: 55, fontSize: 13, fontWeight: '600', color: '#374151', textAlign: 'right' },
});