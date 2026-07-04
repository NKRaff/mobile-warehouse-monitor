import { api } from '@/src/service/api';
import { router } from 'expo-router';
import React, { useState } from 'react';
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

export default function CadastroUsuarioScreen() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [receberEmail, setReceberEmail] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCadastro = async () => {
    if (!nome || !email || !senha) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
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
      
      Alert.alert('Sucesso', 'Usuário cadastrado com sucesso!');
      router.back(); // Volta para a tela anterior (ex: login)
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível cadastrar o usuário.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Nome Completo</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite seu nome"
          value={nome}
          onChangeText={setNome}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>E-mail</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite seu e-mail"
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
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
        />
      </View>

      <View style={styles.switchContainer}>
        <View style={{ flex: 1 }}>
          <Text style={styles.switchLabel}>Receber alertas por e-mail</Text>
          <Text style={styles.switchDescription}>
            Enviaremos notificações importantes para sua caixa de entrada.
          </Text>
        </View>
        <Switch
          value={receberEmail}
          onValueChange={setReceberEmail}
          trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
          thumbColor={receberEmail ? '#2563EB' : '#F3F4F6'}
        />
      </View>

      <TouchableOpacity 
        style={styles.btnPrincipal} 
        onPress={handleCadastro}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.btnText}>Cadastrar</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { padding: 20, paddingBottom: 40 },
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
  btnDangerText: { color: '#DC3545', fontSize: 15, fontWeight: '600' }
});