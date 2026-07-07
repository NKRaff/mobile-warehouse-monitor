import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// IMPORT DO EXPO ROUTER
import { useAuth } from '@/src/contexts/AuthContext';
import { api } from '@/src/service/api';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUserId } = useAuth();
  const router = useRouter();

  // Estado do Modal Customizado
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    type: 'success' | 'warning' | 'confirm';
    onConfirm: () => void;
  } | null>(null);

  const handleLogin = async () => {
    if (!email || !senha) {
      setModalConfig({
        title: 'Atenção',
        message: 'Por favor, preencha o e-mail e a senha para entrar.',
        type: 'warning',
        onConfirm: () => {}
      });
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/autenticacao', { email, senha });
      const { id } = response.data;
      
      await setUserId(id);
      
      // REDIRECIONAMENTO COM EXPO ROUTER
      router.replace('../ambientes');

    } catch (error: any) {
      console.error(error);
      setModalConfig({
        title: 'Falha no Login',
        message: error.response?.data?.message || 'Verifique suas credenciais de acesso.',
        type: 'warning',
        onConfirm: () => {}
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          keyboardShouldPersistTaps='handled'
        >
          <View style={styles.container}>
            {/* LOGO & BOAS-VINDAS */}
            <View style={styles.logoContainer}>
              <View style={styles.logoIconBg}>
                <Ionicons name="shield-checkmark" size={32} color="#4F46E5" />
              </View>
              <Text style={styles.appTitle}>Warehouse Monitor</Text>
              <Text style={styles.appSubtitle}>Telemetria e controle térmico inteligente</Text>
            </View>

            {/* CARD DE LOGIN */}
            <View style={styles.loginCard}>
              <Text style={styles.cardTitle}>Acesse sua Conta</Text>

              <Text style={styles.label}>E-mail corporativo</Text>
              <TextInput
                style={styles.input}
                placeholder="nome@empresa.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              <Text style={styles.label}>Senha secreta</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                value={senha}
                onChangeText={setSenha}
              />

              <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]} 
                onPress={handleLogin} 
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Entrar no Painel</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
  scrollContent: { flexGrow: 1, backgroundColor: '#F1F5F9' },
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logoIconBg: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2 },
  appTitle: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
  appSubtitle: { fontSize: 13, color: '#64748B', marginTop: 4, textAlign: 'center' },
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 3
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1E293B', height: 50 },
  button: { backgroundColor: '#4F46E5', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 24, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

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