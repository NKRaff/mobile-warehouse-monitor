import { Ionicons } from '@expo/vector-icons'; // Certifique-se de ter o icons instalado
import { Tabs } from 'expo-router';

export default function DashboardLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#007BFF', headerShown: false }}>

      <Tabs.Screen 
        name="ambientes" 
        options={{ 
          title: 'Ambientes',
          tabBarIcon: ({ color }) => <Ionicons name="business" size={24} color={color} />
        }} 
      />

      <Tabs.Screen 
        name="dispositivos" 
        options={{ 
          title: 'Dispositivos',
          tabBarIcon: ({ color }) => <Ionicons name="hardware-chip" size={24} color={color} />
        }} 
      />

      <Tabs.Screen 
        name="notificacoes" 
        options={{ 
          title: 'Notificações',
          tabBarIcon: ({ color }) => <Ionicons name="notifications" size={24} color={color} />
        }} 
      />

    </Tabs>
  );
}