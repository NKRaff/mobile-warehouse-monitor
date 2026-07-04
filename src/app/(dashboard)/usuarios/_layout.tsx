import { AuthProvider } from '@/src/contexts/AuthContext';
import { Stack } from 'expo-router';

export default function DispositivosLayout() {
  return (
    <AuthProvider>

      <Stack>
        {/* index é a listagem, o ponto de entrada da aba */}
        <Stack.Screen 
          name="index" 
          options={{ title: 'Meu Perfil' }}  
        />

        <Stack.Screen 
          name="cadastro" 
          options={{ 
            title: 'Criar Conta',
            headerBackTitle: 'Voltar' 
          }} 
        />
      </Stack>
      
    </AuthProvider>
  );
}