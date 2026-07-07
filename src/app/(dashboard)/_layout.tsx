import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function DashboardLayout() {
  return (
    <Tabs 
      screenOptions={{ 
        tabBarActiveTintColor: '#4F46E5', // Premium Indigo
        tabBarInactiveTintColor: '#64748B', // Slate
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          elevation: 8,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        }
      }}
    >

      <Tabs.Screen 
        name="ambientes" 
        options={{ 
          title: 'Ambientes',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "business" : "business-outline"} size={22} color={color} />
          )
        }} 
      />

      <Tabs.Screen 
        name="dispositivos" 
        options={{ 
          title: 'Dispositivos',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "hardware-chip" : "hardware-chip-outline"} size={22} color={color} />
          )
        }} 
      />

      <Tabs.Screen 
        name="notificacoes" 
        options={{ 
          title: 'Notificações',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "notifications" : "notifications-outline"} size={22} color={color} />
          )
        }} 
      />

      <Tabs.Screen 
        name="usuarios" 
        options={{ 
          title: 'Usuários',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} />
          )
        }} 
      />

    </Tabs>
  );
}