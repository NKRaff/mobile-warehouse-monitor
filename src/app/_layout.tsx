import { Slot } from 'expo-router';
// Importe aqui seus Providers globais (ex: Redux, Context API de Tema)

export default function RootLayout() {
  return (
    // <ThemeProvider>
       <Slot /> 
    // </ThemeProvider>
  );
}