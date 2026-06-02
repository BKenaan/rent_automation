import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LayoutDashboard, Users, Building2, FileText, CreditCard, ReceiptText } from 'lucide-react-native';
import { colors, fonts } from '../theme';

import DashboardScreen  from '../screens/DashboardScreen';
import TenantsScreen    from '../screens/TenantsScreen';
import UnitsScreen      from '../screens/UnitsScreen';
import LeasesScreen     from '../screens/LeasesScreen';
import PaymentsScreen   from '../screens/PaymentsScreen';
import ExpensesScreen   from '../screens/ExpensesScreen';

const Tab = createBottomTabNavigator();

const tabBar = {
  tabBarStyle: {
    backgroundColor: colors.surface1,
    borderTopColor: colors.border,
    height: 60,
    paddingBottom: 8,
  },
  tabBarActiveTintColor:   colors.accentHover,
  tabBarInactiveTintColor: colors.text3,
  tabBarLabelStyle: { fontSize: 10, fontFamily: fonts.medium },
  tabBarIconStyle: { marginBottom: -2 },
  headerStyle: {
    backgroundColor: colors.navy,
    borderBottomWidth: 0,
  },
  headerTintColor: '#fff',
  headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 17, color: '#fff' },
  headerShadowVisible: false,
};

export default function AppNavigator() {
  return (
    <Tab.Navigator screenOptions={tabBar}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Dashboard', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Tenants"
        component={TenantsScreen}
        options={{ title: 'Tenants', tabBarIcon: ({ color, size }) => <Users color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Units"
        component={UnitsScreen}
        options={{ title: 'Units', tabBarIcon: ({ color, size }) => <Building2 color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Leases"
        component={LeasesScreen}
        options={{ title: 'Leases', tabBarIcon: ({ color, size }) => <FileText color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Payments"
        component={PaymentsScreen}
        options={{ title: 'Payments', tabBarIcon: ({ color, size }) => <CreditCard color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Expenses"
        component={ExpensesScreen}
        options={{ title: 'Expenses', tabBarIcon: ({ color, size }) => <ReceiptText color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}
