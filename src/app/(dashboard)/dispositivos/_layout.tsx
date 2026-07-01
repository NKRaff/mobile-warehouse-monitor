import { Stack } from 'expo-router';

export default function AmbientesLayout() {
  return (
    <Stack>
      {/* index é a listagem, o ponto de entrada da aba */}
      <Stack.Screen 
        name="index" 
        options={{ title: 'Meus Dispositivos' }}  
      />
    </Stack>
  );
}