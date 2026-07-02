import { api } from '@/src/service/api';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
        Alert.alert('Erro', 'Não foi possível carregar a lista de locais para vínculo.');
      } finally {
        setLoadingAmbientes(false);
      }
    };
    fetchAmbientes();
  }, []);

  // 2. Máscara de Formatação para Endereço MAC (XX:XX:XX:XX:XX:XX)
  const handleMacChange = (text: string) => {
    // Remove caracteres inválidos e força caixa alta
    let cleaned = text.toUpperCase().replace(/[^0-9A-F]/g, '');
    
    // Limita ao tamanho máximo de caracteres de um MAC address (12 hexadecimais)
    if (cleaned.length > 12) cleaned = cleaned.substring(0, 12);

    // Agrupa de 2 em 2 caracteres inserindo os dois pontos ':'
    const matched = cleaned.match(/.{1,2}/g);
    const formatted = matched ? matched.join(':') : cleaned;

    setMacId(formatted);
  };

  // 3. Submissão (Salvar / Atualizar)
  const handleSalvar = async () => {
    if (macId.length !== 17) {
      return Alert.alert('Aviso', 'Por favor, insira um endereço MAC válido (12 dígitos hexadecimais).');
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
        Alert.alert('Sucesso', 'Configurações do hardware salvas.');
      } else {
        // POST /dispositivo/
        await api.post('/dispositivo/', {
          id: macId, // O ID físico do hardware vai no corpo no POST
          ...payload
        });
        Alert.alert('Sucesso', 'Sensor registrado e ativo.');
      }
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Ocorreu um problema ao registrar o dispositivo.');
    } finally {
      setLoadingSubmit(false);
    }
  };

  // 4. Deleção do Dispositivo
  const handleDeletar = () => {
    Alert.alert(
      'Remover Hardware',
      `Tem certeza que deseja desvincular e apagar o sensor físico ${macId}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, Apagar',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await api.delete(`/dispositivo/${params.id}`);
              Alert.alert('Sucesso', 'Dispositivo removido do sistema.');
              router.back();
            } catch (error) {
              console.error(error);
              Alert.alert('Erro', 'Não foi possível deletar o hardware.');
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{isEditing ? 'Configurar Sensor' : 'Novo Sensor IoT'}</Text>
        <Text style={styles.subtitle}>
          {isEditing ? 'Altere o apelido ou o local de operação.' : 'Vincule um novo hardware à rede do armazém.'}
        </Text>
      </View>

      {/* FORMULÁRIO */}
      <Text style={styles.label}>Endereço MAC (Identificador Único)</Text>
      <TextInput
        style={[styles.input, isEditing && styles.inputDisabled]}
        placeholder="00:1A:2B:3C:4D:5E"
        value={macId}
        onChangeText={handleMacChange}
        editable={!isEditing} // O ID físico/MAC não muda após criado
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
          <ActivityIndicator size="small" color="#007BFF" style={{ padding: 14 }} />
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
        >
          {deleting ? (
            <ActivityIndicator color="#DC3545" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={18} color="#DC3545" style={{ marginRight: 6 }} />
              <Text style={styles.btnExcluirText}>Excluir Dispositivo</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { padding: 20, paddingBottom: 60 },
  header: { marginBottom: 24 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#212529' },
  subtitle: { fontSize: 14, color: '#6C757D', marginTop: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#495057', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CED4DA', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#212529' },
  inputDisabled: { backgroundColor: '#E9ECEF', color: '#6C757D', borderColor: '#DEE2E6' },
  infoText: { fontSize: 11, color: '#6C757D', marginTop: 4, fontStyle: 'italic' },
  pickerContainer: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CED4DA', borderRadius: 8, overflow: 'hidden' },
  picker: { height: 50, width: '100%' },
  btnSalvar: { backgroundColor: '#007BFF', borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginTop: 24, elevation: 2 },
  btnDisabled: { opacity: 0.7 },
  btnSalvarText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  btnExcluir: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DC3545', borderRadius: 8, paddingVertical: 14, marginTop: 16 },
  btnExcluirText: { color: '#DC3545', fontSize: 15, fontWeight: 'bold' }
});