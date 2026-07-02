import { api } from '@/src/service/api';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
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
  // Captura as propriedades enviadas pela listagem
  const { id, nome, tipo } = useLocalSearchParams<{ id: string; nome: string; tipo: string }>();

  const [tempAtual, setTempAtual] = useState<Medicao | null>(null);
  const [umiAtual, setUmiAtual] = useState<Medicao | null>(null);
  const [historico, setHistorico] = useState<Medicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Definição das réguas de segurança baseadas no tipo de armazém alimentar
  const limites = tipo?.toLowerCase() === 'frio' 
    ? { tempMin: 2, tempMax: 8, umiMin: 60, umiMax: 85 } // Padrão Frigorífico
    : { tempMin: 15, tempMax: 25, umiMin: 35, umiMax: 60 }; // Padrão Grãos/Secos

  const fetchTelemetria = async () => {
    try {
      // Executa as buscas em paralelo para evitar travamentos de tela (Otimização Mobile)
      const [resTemp, resUmi, resHistorico] = await Promise.all([
        api.post<Medicao>('/medicao/buscar-ultima', { ambienteId: id, tipo: 'temperatura' }).catch(() => null),
        api.post<Medicao>('/medicao/buscar-ultima', { ambienteId: id, tipo: 'umidade' }).catch(() => null),
        api.post<{ medicoes: Medicao[] }>('/medicao/buscar', { 
          ambienteId: id, 
          startData: new Date(Date.now() - 4 * 60 * 60 * 1000) // Últimas 4 horas
        }).catch(() => ({ data: { medicoes: [] } }))
      ]);

      if (resTemp) setTempAtual(resTemp.data);
      if (resUmi) setUmiAtual(resUmi.data);
      if (resHistorico) {
        // Ordena o histórico para mostrar as medições mais recentes no topo do gráfico
        const ordenado = resHistorico.data.medicoes.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setHistorico(ordenado.slice(0, 5)); // Exibe as 5 últimas flutuações no mini-gráfico
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
  }, [tempAtual]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTelemetria();
  };

  // Funções auxiliares para validação das Margens de Segurança
  const isTempSegura = tempAtual ? (tempAtual.valor >= limites.tempMin && tempAtual.valor <= limites.tempMax) : true;
  const isUmiSegura = umiAtual ? (umiAtual.valor >= limites.umiMin && umiAtual.valor <= limites.umiMax) : true;

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Conectando aos sensores do armazém...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Cabeçalho do Armazém */}
      <View style={styles.header}>
        <Text style={styles.title}>{nome}</Text>
        <Text style={styles.subtitle}>ID do Setor: {id}</Text>
      </View>

      {/* PAINEL DE STATUS EM TEMPO REAL */}
      <Text style={styles.sectionTitle}>Telemetria Atual</Text>
      <View style={styles.row}>
        
        {/* Card de Temperatura */}
        <View style={[styles.telemetriaCard, isTempSegura ? styles.borderSeguro : styles.borderInseguro]}>
          <View style={styles.cardTop}>
            <Ionicons name="thermometer" size={24} color={isTempSegura ? "#28A745" : "#DC3545"} />
            <Text style={[styles.statusText, isTempSegura ? styles.textSeguro : styles.textInseguro]}>
              {isTempSegura ? "Seguro" : "Crítico"}
            </Text>
          </View>
          <Text style={styles.valorPrincipal}>{tempAtual ? `${tempAtual.valor}°C` : '--'}</Text>
          <Text style={styles.legendaLimite}>Ideal: {limites.tempMin}°C a {limites.tempMax}°C</Text>
        </View>

        {/* Card de Umidade */}
        <View style={[styles.telemetriaCard, isUmiSegura ? styles.borderSeguro : styles.borderInseguro]}>
          <View style={styles.cardTop}>
            <Ionicons name="water" size={24} color={isUmiSegura ? "#28A745" : "#DC3545"} />
            <Text style={[styles.statusText, isUmiSegura ? styles.textSeguro : styles.textInseguro]}>
              {isUmiSegura ? "Seguro" : "Crítico"}
            </Text>
          </View>
          <Text style={styles.valorPrincipal}>{umiAtual ? `${umiAtual.valor}%` : '--'}</Text>
          <Text style={styles.legendaLimite}>Ideal: {limites.umiMin}% a {limites.umiMax}%</Text>
        </View>

      </View>

      {/* GRÁFICO NATIVO DE TENDÊNCIA (Últimas Oscilações) */}
      <Text style={styles.sectionTitle}>Tendência e Histórico Recente</Text>
      <View style={styles.graficoContainer}>
        {historico.length === 0 ? (
          <Text style={styles.emptyGraphText}>Nenhum dado computado nas últimas horas.</Text>
        ) : (
          historico.map((medicao) => {
            const ehTemp = medicao.tipo === 'temperatura';
            const valorMaximoRegua = ehTemp ? limites.tempMax * 1.5 : limites.umiMax * 1.2;
            
            // Calcula a largura da barra proporcionalmente para simular o gráfico de linhas/barras
            const preenchimentoBarra = `${Math.min((medicao.valor / valorMaximoRegua) * 100, 100)}%`;
            const horaFormatada = new Date(medicao.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <View key={medicao.id} style={styles.graficoLinha}>
                <Text style={styles.graficoHora}>{horaFormatada}</Text>
                <View style={styles.graficoBarraBackground}>
                  <View style={[
                    styles.graficoBarraPreenchida, 
                    { width: preenchimentoBarra, backgroundColor: ehTemp ? '#007BFF' : '#20B2AA' }
                  ]} />
                </View>
                <Text style={styles.graficoValor}>
                  {medicao.valor}{ehTemp ? '°C' : '%'}
                </Text>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  loadingText: { marginTop: 12, color: '#6C757D', fontSize: 15 },
  header: { marginBottom: 24, backgroundColor: '#FFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E9ECEF' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#212529' },
  subtitle: { fontSize: 13, color: '#6C757D', marginTop: 4, fontFamily: 'monospace' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#495057', marginBottom: 12, marginTop: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  telemetriaCard: { flex: 0.48, backgroundColor: '#FFF', borderRadius: 12, padding: 14, borderWidth: 2, elevation: 1 },
  borderSeguro: { borderColor: '#28A745' },
  borderInseguro: { borderColor: '#DC3545' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  textSeguro: { color: '#28A745' },
  textInseguro: { color: '#DC3545' },
  valorPrincipal: { fontSize: 32, fontWeight: 'bold', color: '#212529', marginVertical: 4 },
  legendaLimite: { fontSize: 11, color: '#6C757D', marginTop: 4 },
  graficoContainer: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E9ECEF', marginBottom: 40 },
  emptyGraphText: { color: '#6C757D', textAlign: 'center', paddingVertical: 20 },
  graficoLinha: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  graficoHora: { width: 45, fontSize: 12, color: '#6C757D' },
  graficoBarraBackground: { flex: 1, height: 12, backgroundColor: '#E9ECEF', borderRadius: 6, marginHorizontal: 10, overflow: 'hidden' },
  graficoBarraPreenchida: { height: '100%', borderRadius: 6 },
  graficoValor: { width: 50, fontSize: 13, fontWeight: '600', color: '#343A40', textAlign: 'right' }
});