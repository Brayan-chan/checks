import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { palette } from '@/components/ChecksUI';

function Icon({ symbol, active }: { symbol: string; active: boolean }) { return <View style={[styles.icon, active && styles.iconActive]}><Text style={[styles.symbol, active && styles.symbolActive]}>{symbol}</Text></View>; }

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, sceneStyle: { backgroundColor: palette.bg }, tabBarStyle: styles.bar, tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: palette.text, tabBarInactiveTintColor: palette.muted, tabBarLabelStyle: styles.label,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused }) => <Icon symbol="⌂" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Progreso',
          tabBarIcon: ({ focused }) => <Icon symbol="⌁" active={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({ bar: { position: 'absolute', height: 76, paddingTop: 8, paddingBottom: 8, margin: 14, borderRadius: 26, backgroundColor: '#171B22', borderTopWidth: 0, elevation: 12 }, label: { fontSize: 11, fontWeight: '700' }, icon: { width: 42, height: 30, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, iconActive: { backgroundColor: palette.lime }, symbol: { color: palette.muted, fontSize: 24, fontWeight: '900' }, symbolActive: { color: '#11150B' } });
