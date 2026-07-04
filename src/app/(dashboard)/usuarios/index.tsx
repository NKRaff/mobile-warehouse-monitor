import { useAuth } from '@/src/contexts/AuthContext';
import { api } from '@/src/service/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function PerfilUsuarioScreen() {
  const { userId } = useAuth();
  
  // LOG 1: Verifica o estado global em cada renderização
  console.log('🔄 Renderizando PerfilUsuarioScreen | userId atual:', userId);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [receberEmail, setReceberEmail] = useState(false);
  
  const [loadingData, setLoadingData] = useState<boolean>(true); 
  const [loadingSave, setLoadingSave] = useState<boolean>(false);
  const [loadingToggle, setLoadingToggle] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  const fetchUsuario = async () => {
    // LOG 2: Verifica se a função foi chamada
    console.log('🚀 Iniciando fetchUsuario com userId:', userId);

    if (!userId || userId === 'undefined' || userId === 'null') {
      console.log('⚠️ fetchUsuario abortado: userId inválido');
      return;
    }
    
    try {
      setLoadingData(true);
      console.log(`🌐 Disparando requisição: GET /usuario/${userId}`);
      
      const response = await api.get(`/usuario/${userId}`);
      
      // LOG 3: Verifica a estrutura exata da resposta da API
      console.log('✅ Resposta da API recebida:', response.data);
      
      if (response.data) {
        setNome(response.data.nome || '');
        setEmail(response.data.email || '');
        
        const statusEmail = response.data.receberEmail;
        setReceberEmail(statusEmail === 'true' || statusEmail === true);
      }
    } catch (error) {
      // LOG 4: Captura falhas silenciosas de rede ou CORS
      console.error('❌ Erro no catch do fetchUsuario:', error);
      Alert.alert('Erro', 'Não foi possível carregar as informações do perfil.');
    } finally {
      setLoadingData(false); 
      console.log('🏁 Finalizou o loading.');
    }
  };

  useEffect(() => {
    // Se o userId existe e é válido, busca os dados
    if (userId && userId !== 'undefined' && userId !== 'null') {
      console.log('⚡ userId detectado, disparando fetch...');
      fetchUsuario();
    } else {
      // Se ainda for undefined, vamos apenas esperar. 
      // Não setamos loadingData(false) aqui ainda.
      console.log('⏳ userId ainda indefinido, aguardando...');
    }
  }, [userId]);

  const handleAtualizarDados = async () => {
    if (!userId || userId === 'undefined') return;
    setLoadingSave(true);
    try {
      await api.patch('/usuario/', { id: userId, nome, email });
      Alert.alert('Sucesso', 'Seus dados foram atualizados.');
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    } finally {
      setLoadingSave(false);
    }
  };

  const handleToggleEmail = async (novoStatus: boolean) => {
    if (!userId || userId === 'undefined') return;
    const statusAnterior = receberEmail;
    setReceberEmail(novoStatus);
    setLoadingToggle(true);

    try {
      if (novoStatus) {
        await api.post('/usuario/ativar-recebimento-email', { id: userId });
      } else {
        await api.post('/usuario/desativar-recebimento-email', { id: userId });
      }
    } catch (error) {
      console.error(error);
      setReceberEmail(statusAnterior);
      Alert.alert('Erro', 'Não foi possível alterar a preferência de e-mail.');
    } finally {
      setLoadingToggle(false);
    }
  };

  const handleDeletarConta = () => {
    Alert.alert(
      'Atenção!',
      'Tem certeza que deseja excluir sua conta? Esta ação é irreversível.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, Excluir',
          style: 'destructive',
          onPress: async () => {
            if (!userId || userId === 'undefined') return;
            setDeleting(true);
            try {
              await api.delete('/usuario/', { data: { id: userId } });
              Alert.alert('Conta Excluída', 'Sua conta foi removida com sucesso.');
              router.replace('/'); 
            } catch (error) {
              console.error(error);
              Alert.alert('Erro', 'Não foi possível excluir a conta.');
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  if (loadingData) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados Pessoais</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nome Completo</Text>
            <TextInput
              style={styles.input}
              value={nome}
              onChangeText={setNome}
              placeholder="Carregando nome..."
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              placeholder="Carregando e-mail..."
            />
          </View>

          <TouchableOpacity 
            style={styles.btnPrincipal} 
            onPress={handleAtualizarDados}
            disabled={loadingSave || !userId}
          >
            {loadingSave ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.btnText}>Salvar Alterações</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferências</Text>
          
          <View style={styles.switchContainer}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={styles.switchLabel}>Notificações por E-mail</Text>
              <Text style={styles.switchDescription}>
                Receba alertas do sistema e relatórios na sua caixa de entrada.
              </Text>
            </View>
            {loadingToggle ? (
              <ActivityIndicator size="small" color="#007BFF" />
            ) : (
              <Switch
                value={receberEmail}
                onValueChange={handleToggleEmail}
                disabled={!userId}
                trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                thumbColor={receberEmail ? '#2563EB' : '#F3F4F6'}
              />
            )}
          </View>
        </View>

        <View style={styles.sectionDanger}>
          <Text style={styles.sectionTitleDanger}>Zona de Perigo</Text>
          <Text style={styles.dangerText}>
            Ao excluir sua conta, todos os seus dados serão apagados permanentemente do sistema.
          </Text>
          <TouchableOpacity 
            style={styles.btnDanger} 
            onPress={handleDeletarConta}
            disabled={deleting || !userId}
          >
            {deleting ? (
              <ActivityIndicator color="#DC3545" />
            ) : (
              <Text style={styles.btnDangerText}>Excluir Minha Conta</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push('/(dashboard)/usuarios/cadastro')}
        activeOpacity={0.8}
      >
        <Ionicons name="person-add" size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8F9FA' },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 24 },
  section: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 8 },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#4B5563', marginBottom: 6 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1F2937' },
  switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16 },
  switchLabel: { fontSize: 15, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  switchDescription: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  btnPrincipal: { backgroundColor: '#007BFF', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  sectionDanger: { backgroundColor: '#FEF2F2', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FECACA', marginBottom: 20 },
  sectionTitleDanger: { fontSize: 16, fontWeight: '600', color: '#991B1B', marginBottom: 8 },
  dangerText: { fontSize: 13, color: '#7F1D1D', marginBottom: 16 },
  btnDanger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#DC3545', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  btnDangerText: { color: '#DC3545', fontSize: 15, fontWeight: '600' },
  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: '#007BFF', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  loadingText: { marginTop: 12, color: '#6C757D', fontSize: 15 }
});