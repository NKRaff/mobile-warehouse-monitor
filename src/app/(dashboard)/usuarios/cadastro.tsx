import { api } from '@/src/service/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function CadastroUsuarioScreen() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [receberEmail, setReceberEmail] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estado do Modal Customizado
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    type: 'success' | 'warning' | 'confirm';
    onConfirm: () => void;
  } | null>(null);

  const handleCadastro = async () => {
    if (!nome || !email || !senha) {
      setModalConfig({
        title: 'Atenção',
        message: 'Preencha todos os campos obrigatórios.',
        type: 'warning',
        onConfirm: () => {}
      });
      return;
    }

    setLoading(true);
    try {
      await api.post('/usuario/', {
        nome,
        email,
        senha,
        receberEmail
      });
      
      setModalConfig({
        title: 'Sucesso',
        message: 'Usuário cadastrado com sucesso!',
        type: 'success',
        onConfirm: () => router.back()
      });
    } catch (error) {
      console.error(error);
      setModalConfig({
        title: 'Erro',
        message: 'Não foi possível cadastrar o usuário. Tente novamente.',
        type: 'warning',
        onConfirm: () => {}
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{ flex: 1 }}>
        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps='handled'
        >
          <View style={styles.header}>
            <Text style={styles.title}>Novo Operador</Text>
            <Text style={styles.subtitle}>Cadastre um novo usuário com acesso ao sistema.</Text>
          </View>

          {/* CARD DO FORMULÁRIO */}
          <View style={styles.formCard}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nome Completo</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite seu nome"
                placeholderTextColor="#94A3B8"
                value={nome}
                onChangeText={setNome}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite seu e-mail"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Senha</Text>
              <TextInput
                style={styles.input}
                placeholder="Crie uma senha"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                value={senha}
                onChangeText={setSenha}
              />
            </View>

            <View style={styles.switchContainer}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.switchLabel}>Receber alertas por e-mail</Text>
                <Text style={styles.switchDescription}>
                  Notificaremos sobre desvios críticos e status no armazém.
                </Text>
              </View>
              <Switch
                value={receberEmail}
                onValueChange={setReceberEmail}
                trackColor={{ false: '#E2E8F0', true: '#C7D2FE' }}
                thumbColor={receberEmail ? '#4F46E5' : '#F1F5F9'}
              />
            </View>

            <TouchableOpacity 
              style={[styles.btnPrincipal, loading && styles.btnDisabled]} 
              onPress={handleCadastro}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.btnText}>Salvar Cadastro</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  content: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 4 },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: 20
  },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1E293B', height: 50 },
  switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16, marginTop: 8 },
  switchLabel: { fontSize: 14, fontWeight: '600', color: '#1E293B', marginBottom: 4 },
  switchDescription: { fontSize: 12, color: '#64748B', lineHeight: 16 },
  btnPrincipal: { backgroundColor: '#4F46E5', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 12, elevation: 2, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

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