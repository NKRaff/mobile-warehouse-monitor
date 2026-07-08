import { api } from '@/src/service/api';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

interface Ambiente {
  id: string;
  nome: string;
}

export default function CadastroDispositivoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; nome?: string; ambienteId?: string }>();
  const isEditing = !!params.id;

  // Estados dos inputs
  const [macId, setMacId] = useState(params.id || '');
  const [nome, setNome] = useState(params.nome || '');
  const [ambienteId, setAmbienteId] = useState(params.ambienteId || '');

  // Estados auxiliares de API
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [loadingAmbientes, setLoadingAmbientes] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Estado do Modal Customizado
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    type: 'success' | 'warning' | 'confirm';
    onConfirm: () => void;
  } | null>(null);

  // 1. Carrega os ambientes para popular o Dropdown/Picker
  useEffect(() => {
    const fetchAmbientes = async () => {
      try {
        const response = await api.get<{ ambientes: Ambiente[] }>('/ambiente/');
        setAmbientes(response.data.ambientes);
        
        // Se for um novo cadastro e existirem ambientes, pré-seleciona o primeiro
        if (!isEditing && response.data.ambientes.length > 0) {
          setAmbienteId(response.data.ambientes[0].id);
        }
      } catch (error) {
        console.error(error);
        setModalConfig({
          title: 'Erro',
          message: 'Não foi possível carregar a lista de locais para vínculo.',
          type: 'warning',
          onConfirm: () => {}
        });
      } finally {
        setLoadingAmbientes(false);
      }
    };
    fetchAmbientes();
  }, []);

  // 2. Máscara de Formatação para Endereço MAC (XX:XX:XX:XX:XX:XX)
  const handleMacChange = (text: string) => {
    let cleaned = text.toUpperCase().replace(/[^0-9A-F]/g, '');
    if (cleaned.length > 12) cleaned = cleaned.substring(0, 12);
    const matched = cleaned.match(/.{1,2}/g);
    const formatted = matched ? matched.join(':') : cleaned;
    setMacId(formatted);
  };

  // 3. Submissão (Salvar / Atualizar)
  const handleSalvar = async () => {
    if (macId.length !== 17) {
      setModalConfig({
        title: 'Aviso',
        message: 'Por favor, insira um endereço MAC válido (12 dígitos hexadecimais).',
        type: 'warning',
        onConfirm: () => {}
      });
      return;
    }

    setLoadingSubmit(true);
    
    const payload = {
      nome: nome.trim() || undefined,
      ambienteId: ambienteId || undefined
    };

    try {
      if (isEditing) {
        // PATCH /dispositivo/{id}
        await api.patch(`/dispositivo/${params.id}`, payload);
        setModalConfig({
          title: 'Sucesso',
          message: 'Configurações do hardware salvas com sucesso.',
          type: 'success',
          onConfirm: () => router.back()
        });
      } else {
        // POST /dispositivo/
        await api.post('/dispositivo/', {
          id: macId,
          ...payload
        });
        setModalConfig({
          title: 'Sucesso',
          message: 'Sensor registrado e ativo na rede.',
          type: 'success',
          onConfirm: () => router.back()
        });
      }
    } catch (error) {
      console.error(error);
      setModalConfig({
        title: 'Erro',
        message: 'Ocorreu um problema ao registrar o dispositivo. Tente novamente.',
        type: 'warning',
        onConfirm: () => {}
      });
    } finally {
      setLoadingSubmit(false);
    }
  };

  // 4. Deleção do Dispositivo
  const handleDeletar = () => {
    setModalConfig({
      title: 'Remover Hardware',
      message: `Tem certeza que deseja desvincular e apagar o sensor físico ${macId}?`,
      type: 'confirm',
      onConfirm: executarDelecao
    });
  };

  const executarDelecao = async () => {
    setDeleting(true);
    try {
      await api.delete(`/dispositivo/${params.id}`);
      setModalConfig({
        title: 'Sucesso',
        message: 'Dispositivo removido do sistema.',
        type: 'success',
        onConfirm: () => router.back()
      });
    } catch (error) {
      console.error(error);
      setModalConfig({
        title: 'Erro',
        message: 'Não foi possível deletar o hardware.',
        type: 'warning',
        onConfirm: () => {}
      });
      setDeleting(false);
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
            <Text style={styles.title}>{isEditing ? 'Configurar Sensor' : 'Novo Sensor IoT'}</Text>
            <Text style={styles.subtitle}>
              {isEditing ? 'Altere o apelido ou o local de operação.' : 'Vincule um novo hardware à rede do armazém.'}
            </Text>
          </View>

          {/* FORMULÁRIO ENCAPSULADO EM CARD */}
          <View style={styles.formCard}>
            <Text style={styles.label}>Endereço MAC (Identificador Único)</Text>
            <TextInput
              style={[styles.input, isEditing && styles.inputDisabled]}
              placeholder="00:1A:2B:3C:4D:5E"
              value={macId}
              onChangeText={handleMacChange}
              editable={!isEditing}
              keyboardType="default"
              autoCapitalize="characters"
            />
            {isEditing && (
              <Text style={styles.infoText}>O endereço MAC de placas físicas não pode ser modificado.</Text>
            )}

            <Text style={styles.label}>Nome/Apelido do Dispositivo</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Sensor Entrada Extrema"
              value={nome}
              onChangeText={setNome}
            />

            <Text style={styles.label}>Vincular ao Setor / Ambiente</Text>
            <View style={styles.pickerContainer}>
              {loadingAmbientes ? (
                <ActivityIndicator size="small" color="#4F46E5" style={{ padding: 14 }} />
              ) : (
                <Picker
                  selectedValue={ambienteId}
                  onValueChange={(itemValue) => setAmbienteId(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="⚠️ Deixar sem vínculo (Em Estoque)" value="" />
                  {ambientes.map((amb) => (
                    <Picker.Item key={amb.id} label={amb.nome} value={amb.id} />
                  ))}
                </Picker>
              )}
            </View>

            {/* BOTÃO PRINCIPAL */}
            <TouchableOpacity 
              style={[styles.btnSalvar, loadingSubmit && styles.btnDisabled]} 
              onPress={handleSalvar}
              disabled={loadingSubmit}
              activeOpacity={0.8}
            >
              {loadingSubmit ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.btnSalvarText}>{isEditing ? 'Atualizar Vínculo' : 'Registrar Dispositivo'}</Text>
              )}
            </TouchableOpacity>

            {/* BOTÃO DELETAR */}
            {isEditing && (
              <TouchableOpacity 
                style={styles.btnExcluir} 
                onPress={handleDeletar}
                disabled={deleting}
                activeOpacity={0.7}
              >
                {deleting ? (
                  <ActivityIndicator color="#EF4444" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" style={{ marginRight: 6 }} />
                    <Text style={styles.btnExcluirText}>Excluir Dispositivo</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
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
  content: { padding: 16, paddingBottom: 60 },
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
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1E293B' },
  inputDisabled: { backgroundColor: '#F8FAFC', color: '#94A3B8', borderColor: '#E2E8F0' },
  infoText: { fontSize: 11, color: '#64748B', marginTop: 4, fontStyle: 'italic' },
  pickerContainer: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, overflow: 'hidden' },
  picker: { height: 50, width: '100%' },
  btnSalvar: { backgroundColor: '#4F46E5', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 24, elevation: 2, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  btnDisabled: { opacity: 0.7 },
  btnSalvarText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  btnExcluir: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 12, paddingVertical: 14, marginTop: 16 },
  btnExcluirText: { color: '#EF4444', fontSize: 15, fontWeight: 'bold' },
  
  // Estilos do Modal Customizado
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)', // Fundo escuro semi-transparente
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
    backgroundColor: '#D1FAE5' // Esmeralda pastel
  },
  iconBgDanger: {
    backgroundColor: '#FEF2F2' // Vermelho pastel
  },
  iconBgWarning: {
    backgroundColor: '#FEF3C7' // Amarelo pastel
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