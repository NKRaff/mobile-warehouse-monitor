import { useAuth } from '@/src/contexts/AuthContext';
import { api } from '@/src/service/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
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
  
  console.log('🔄 Renderizando PerfilUsuarioScreen | userId atual:', userId);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [receberEmail, setReceberEmail] = useState(false);
  
  const [loadingData, setLoadingData] = useState<boolean>(true); 
  const [loadingSave, setLoadingSave] = useState<boolean>(false);
  const [loadingToggle, setLoadingToggle] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Estado do Modal Customizado
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    type: 'success' | 'warning' | 'confirm';
    onConfirm: () => void;
  } | null>(null);

  const fetchUsuario = async () => {
    console.log('🚀 Iniciando fetchUsuario com userId:', userId);

    if (!userId || userId === 'undefined' || userId === 'null') {
      console.log('⚠️ fetchUsuario abortado: userId inválido');
      return;
    }
    
    try {
      setLoadingData(true);
      console.log(`🌐 Disparando requisição: GET /usuario/${userId}`);
      
      const response = await api.get(`/usuario/${userId}`);
      console.log('✅ Resposta da API recebida:', response.data);
      
      if (response.data) {
        setNome(response.data.nome || '');
        setEmail(response.data.email || '');
        
        const statusEmail = response.data.receberEmail;
        setReceberEmail(statusEmail === 'true' || statusEmail === true);
      }
    } catch (error) {
      console.error('❌ Erro no catch do fetchUsuario:', error);
      setModalConfig({
        title: 'Erro',
        message: 'Não foi possível carregar as informações do seu perfil.',
        type: 'warning',
        onConfirm: () => {}
      });
    } finally {
      setLoadingData(false); 
      console.log('🏁 Finalizou o loading.');
    }
  };

  useEffect(() => {
    if (userId && userId !== 'undefined' && userId !== 'null') {
      console.log('⚡ userId detectado, disparando fetch...');
      fetchUsuario();
    } else {
      console.log('⏳ userId ainda indefinido, aguardando...');
    }
  }, [userId]);

  const handleAtualizarDados = async () => {
    if (!userId || userId === 'undefined') return;
    setLoadingSave(true);
    try {
      await api.patch('/usuario/', { id: userId, nome, email });
      setModalConfig({
        title: 'Sucesso',
        message: 'Seus dados pessoais foram atualizados com sucesso.',
        type: 'success',
        onConfirm: () => {}
      });
    } catch (error) {
      console.error(error);
      setModalConfig({
        title: 'Erro',
        message: 'Não foi possível salvar as alterações. Tente novamente.',
        type: 'warning',
        onConfirm: () => {}
      });
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
      setModalConfig({
        title: 'Erro',
        message: 'Não foi possível alterar a preferência de notificação por e-mail.',
        type: 'warning',
        onConfirm: () => {}
      });
    } finally {
      setLoadingToggle(false);
    }
  };

  const handleDeletarConta = () => {
    setModalConfig({
      title: 'Atenção!',
      message: 'Tem certeza que deseja excluir sua conta permanentemente? Esta ação é irreversível.',
      type: 'confirm',
      onConfirm: executarDelecaoConta
    });
  };

  const executarDelecaoConta = async () => {
    if (!userId || userId === 'undefined') return;
    setDeleting(true);
    try {
      await api.delete('/usuario/', { data: { id: userId } });
      setModalConfig({
        title: 'Conta Removida',
        message: 'Sua conta foi excluída com sucesso do sistema.',
        type: 'success',
        onConfirm: () => router.replace('/')
      });
    } catch (error) {
      console.error(error);
      setModalConfig({
        title: 'Erro',
        message: 'Não foi possível excluir sua conta. Contate o administrador.',
        type: 'warning',
        onConfirm: () => {}
      });
      setDeleting(false);
    }
  };

  if (loadingData) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.mainContainer}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          
          {/* SEÇÃO DADOS PESSOAIS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dados Pessoais</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nome Completo</Text>
              <TextInput
                style={styles.input}
                value={nome}
                onChangeText={setNome}
                placeholder="Carregando nome..."
                placeholderTextColor="#94A3B8"
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
                placeholderTextColor="#94A3B8"
              />
            </View>

            <TouchableOpacity 
              style={[styles.btnPrincipal, loadingSave && styles.btnDisabled]} 
              onPress={handleAtualizarDados}
              disabled={loadingSave || !userId}
              activeOpacity={0.8}
            >
              {loadingSave ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.btnText}>Salvar Alterações</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* SEÇÃO PREFERÊNCIAS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferências</Text>
            
            <View style={styles.switchContainer}>
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text style={styles.switchLabel}>Notificações por E-mail</Text>
                <Text style={styles.switchDescription}>
                  Receba alertas críticos de temperatura e umidade diretamente na sua caixa de entrada.
                </Text>
              </View>
              {loadingToggle ? (
                <ActivityIndicator size="small" color="#4F46E5" />
              ) : (
                <Switch
                  value={receberEmail}
                  onValueChange={handleToggleEmail}
                  disabled={!userId}
                  trackColor={{ false: '#E2E8F0', true: '#C7D2FE' }}
                  thumbColor={receberEmail ? '#4F46E5' : '#F1F5F9'}
                />
              )}
            </View>
          </View>

          {/* ZONA DE PERIGO */}
          <View style={styles.sectionDanger}>
            <Text style={styles.sectionTitleDanger}>Zona de Perigo</Text>
            <Text style={styles.dangerText}>
              Ao excluir sua conta, todas as suas permissões de operador serão revogadas e os dados apagados permanentemente.
            </Text>
            <TouchableOpacity 
              style={styles.btnDanger} 
              onPress={handleDeletarConta}
              disabled={deleting || !userId}
              activeOpacity={0.7}
            >
              {deleting ? (
                <ActivityIndicator color="#EF4444" />
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
  mainContainer: { flex: 1, backgroundColor: '#F1F5F9' },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  section: { 
    backgroundColor: '#FFF', 
    padding: 16, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1 
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1E293B', height: 50 },
  switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { fontSize: 14, fontWeight: '600', color: '#1E293B', marginBottom: 4 },
  switchDescription: { fontSize: 12, color: '#64748B', lineHeight: 16 },
  btnPrincipal: { backgroundColor: '#4F46E5', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8, elevation: 2, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  
  // Seção de perigo customizada
  sectionDanger: { 
    backgroundColor: '#FFF', 
    padding: 16, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#FCA5A5', 
    marginBottom: 16,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1 
  },
  sectionTitleDanger: { fontSize: 14, fontWeight: '700', color: '#B91C1C', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  dangerText: { fontSize: 12, color: '#7F1D1D', marginBottom: 16, lineHeight: 16 },
  btnDanger: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnDangerText: { color: '#EF4444', fontSize: 15, fontWeight: 'bold' },
  
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
  },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9' },
  loadingText: { marginTop: 12, color: '#64748B', fontSize: 15 },

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