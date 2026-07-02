import { Stack } from 'expo-router';

export default function DispositivosLayout() {
  return (
    <Stack>
      {/* index é a listagem, o ponto de entrada da aba */}
      <Stack.Screen 
        name="index" 
        options={{ title: 'Meus Dispositivos' }}  
      />

      <Stack.Screen 
        name="cadastro" 
        options={{ 
          title: '',
          headerBackTitle: 'Voltar' 
        }} 
      />
    </Stack>
  );
}