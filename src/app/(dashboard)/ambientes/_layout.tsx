import { Stack } from 'expo-router';

export default function AmbientesLayout() {
  return (
    <Stack>
      {/* index é a listagem, o ponto de entrada da aba */}
      <Stack.Screen 
        name="index" 
        options={{ title: 'Meus Ambientes' }} 
      />
      
      {/* cadastro é a tela secundária, que herda o botão de voltar */}
      <Stack.Screen 
        name="cadastro" 
        options={{ 
          title: 'Novo Ambiente',
          headerBackTitle: 'Voltar' 
        }} 
      />

      <Stack.Screen 
        name="[id]"
        options={{ 
          title: '',
          headerBackTitle: 'Voltar' 
        }} 
      />
    </Stack>
  );
}