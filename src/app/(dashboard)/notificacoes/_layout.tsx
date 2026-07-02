import { AuthProvider } from '@/src/contexts/AuthContext';
import { Stack } from 'expo-router';

export default function NotificacoesLayout() {
  return (
    <AuthProvider>
      <Stack>
      <Stack.Screen 
        name="index" 
        options={{ title: 'Notificações' }}  
      />
    </Stack>
    </AuthProvider>
  );
}