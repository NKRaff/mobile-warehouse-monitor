import { AuthProvider } from '@/src/contexts/AuthContext';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
    </AuthProvider>
  );
}