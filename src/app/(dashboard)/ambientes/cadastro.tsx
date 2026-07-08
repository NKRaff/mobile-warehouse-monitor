import { api } from '@/src/service/api';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

export default function CadastroAmbienteScreen() {
  const router = useRouter();
  
  const params = useLocalSearchParams<{ 
    id?: string; 
    nome?: string; 
    tipo?: string; 
    descricao?: string;
    temperatura_minima?: string;
    temperatura_maxima?: string;
    umidade_minima?: string;
    umidade_maxima?: string;
  }>();
  
  const isEditing = !!params.id;

  const [nome, setNome] = useState(params.nome || '');
  const [tipo, setTipo] = useState(params.tipo || 'frio');
  const [descricao, setDescricao] = useState(params.descricao || '');

  const [tempMin, setTempMin] = useState(params.temperatura_minima ? String(params.temperatura_minima) : '');
  const [tempMax, setTempMax] = useState(params.temperatura_maxima ? String(params.temperatura_maxima) : '');
  const [umiMin, setUmiMin] = useState(params.umidade_minima ? String(params.umidade_minima) : '');
  const [umiMax, setUmiMax] = useState(params.umidade_maxima ? String(params.umidade_maxima) : '');

  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // Estado do Modal Customizado
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    type: 'success' | 'warning' | 'confirm';
    onConfirm: () => void;
  } | null>(null);

  const handleSalvar = async () => {
    if (!nome.trim()) {
      setModalConfig({
        title: 'Aviso',
        message: 'O nome do ambiente é obrigatório.',
        type: 'warning',
        onConfirm: () => {}
      });
      return;
    }
    if (!tempMin || !tempMax || !umiMin || !umiMax) {
      setModalConfig({
        title: 'Aviso',
        message: 'Defina todos os limites de segurança (Temperatura e Umidade).',
        type: 'warning',
        onConfirm: () => {}
      });
      return;
    }

    setLoadingSubmit(true);

    const payload = {
      nome: nome.trim(),
      tipo,
      descricao: descricao.trim(),
      temperatura_minima: parseFloat(tempMin.replace(',', '.')),
      temperatura_maxima: parseFloat(tempMax.replace(',', '.')),
      umidade_minima: parseFloat(umiMin.replace(',', '.')),
      umidade_maxima: parseFloat(umiMax.replace(',', '.')),
    };

    try {
      if (isEditing) {
        await api.patch(`/ambiente/${params.id}`, payload);
        setModalConfig({
          title: 'Sucesso',
          message: 'Configurações do ambiente atualizadas com sucesso.',
          type: 'success',
          onConfirm: () => router.back()
        });
      } else {
        await api.post('/ambiente/', payload);
        setModalConfig({
          title: 'Sucesso',
          message: 'Novo ambiente registrado e ativo.',
          type: 'success',
          onConfirm: () => router.back()
        });
      }
    } catch (error) {
      console.error(error);
      setModalConfig({
        title: 'Erro',
        message: 'Ocorreu um problema ao salvar as configurações do ambiente.',
        type: 'warning',
        onConfirm: () => {}
      });
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} 
      >
        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.content} 
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{isEditing ? 'Configurar Setor' : 'Novo Ambiente'}</Text>
            <Text style={styles.subtitle}>
              {isEditing ? 'Ajuste os parâmetros de armazenamento.' : 'Crie um novo setor e defina suas réguas de tolerância.'}
            </Text>
          </View>

          {/* CARD DO FORMULÁRIO */}
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Dados Gerais</Text>

            <Text style={styles.label}>Nome do Ambiente</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Câmara Fria 01"
              value={nome}
              onChangeText={setNome}
            />

            <Text style={styles.label}>Tipo de Armazenamento</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={tipo}
                onValueChange={(itemValue) => setTipo(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="❄️ Frio (Frigoríficos / Vacinas)" value="frio" />
                <Picker.Item label="🌡️ Arejado (Grãos / Secos)" value="arejado" />
              </Picker>
            </View>

            <Text style={styles.label}>Descrição (Opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Detalhes sobre a carga ou localização..."
              value={descricao}
              onChangeText={setDescricao}
              multiline
              numberOfLines={3}
            />

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Tolerância e Limites</Text>
            
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>Temp. Mínima (°C)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 2"
                  keyboardType="numeric"
                  value={tempMin}
                  onChangeText={setTempMin}
                />
              </View>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>Temp. Máxima (°C)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 8"
                  keyboardType="numeric"
                  value={tempMax}
                  onChangeText={setTempMax}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>Umidade Mínima (%)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 60"
                  keyboardType="numeric"
                  value={umiMin}
                  onChangeText={setUmiMin}
                />
              </View>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>Umidade Máxima (%)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 85"
                  keyboardType="numeric"
                  value={umiMax}
                  onChangeText={setUmiMax}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.btnSalvar, loadingSubmit && styles.btnDisabled]} 
              onPress={handleSalvar}
              disabled={loadingSubmit}
              activeOpacity={0.8}
            >
              {loadingSubmit ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.btnSalvarText}>{isEditing ? 'Salvar Alterações' : 'Cadastrar Ambiente'}</Text>
              )}
            </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  content: { padding: 16, paddingBottom: 60, flexGrow: 1 },
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
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1E293B' },
  textArea: { textAlignVertical: 'top', minHeight: 80 },
  pickerContainer: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, overflow: 'hidden' },
  picker: { height: 50, width: '100%' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfWidth: { width: '48%' },
  btnSalvar: { backgroundColor: '#4F46E5', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 28, elevation: 2, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  btnDisabled: { opacity: 0.7 },
  btnSalvarText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

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