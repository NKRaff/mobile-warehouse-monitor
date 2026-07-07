import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para capturar erros 401 (Não Autorizado)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Sessão expirada ou inválida (401). Redirecionando para login...');
      
      try {
        // Importação dinâmica para evitar problemas de inicialização precoce no Expo
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.removeItem('userId');
      } catch (storageError) {
        console.error('Erro ao limpar dados de autenticação:', storageError);
      }

      try {
        const { router } = require('expo-router');
        // Redireciona o usuário para a tela de autenticação
        router.replace('/(auth)');
      } catch (routerError) {
        console.error('Erro ao redirecionar para o login:', routerError);
      }
    }
    return Promise.reject(error);
  }
);