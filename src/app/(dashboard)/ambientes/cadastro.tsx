import { api } from '@/src/service/api';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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
  
  // CORREÇÃO 3: Tipagem adicionando os limites que vêm da navegação
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

  // CORREÇÃO 4: Inicializando os estados com os valores vindos dos params (garantindo que virem String para o Input)
  const [tempMin, setTempMin] = useState(params.temperatura_minima ? String(params.temperatura_minima) : '');
  const [tempMax, setTempMax] = useState(params.temperatura_maxima ? String(params.temperatura_maxima) : '');
  const [umiMin, setUmiMin] = useState(params.umidade_minima ? String(params.umidade_minima) : '');
  const [umiMax, setUmiMax] = useState(params.umidade_maxima ? String(params.umidade_maxima) : '');

  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const handleSalvar = async () => {
    if (!nome.trim()) {
      return Alert.alert('Aviso', 'O nome do ambiente é obrigatório.');
    }
    if (!tempMin || !tempMax || !umiMin || !umiMax) {
      return Alert.alert('Aviso', 'Defina todos os limites de segurança (Temperatura e Umidade).');
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
        Alert.alert('Sucesso', 'Configurações do ambiente atualizadas.');
      } else {
        await api.post('/ambiente/', payload);
        Alert.alert('Sucesso', 'Novo ambiente registrado e ativo.');
      }
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Ocorreu um problema ao salvar o ambiente.');
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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

        <Text style={styles.sectionTitle}>Tolerância e Limites</Text>
        
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
        >
          {loadingSubmit ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.btnSalvarText}>{isEditing ? 'Salvar Alterações' : 'Cadastrar Ambiente'}</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { padding: 20, paddingBottom: 120, flexGrow: 1 },
  header: { marginBottom: 24 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#212529' },
  subtitle: { fontSize: 14, color: '#6C757D', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#495057', marginTop: 16, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E9ECEF', paddingBottom: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#495057', marginBottom: 6 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CED4DA', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#212529', marginBottom: 16 },
  textArea: { textAlignVertical: 'top', minHeight: 80 },
  pickerContainer: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CED4DA', borderRadius: 8, marginBottom: 16, overflow: 'hidden' },
  picker: { height: 50, width: '100%' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfWidth: { width: '48%' },
  btnSalvar: { backgroundColor: '#007BFF', borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginTop: 24, elevation: 2 },
  btnDisabled: { opacity: 0.7 },
  btnSalvarText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});