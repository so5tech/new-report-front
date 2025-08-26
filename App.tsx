import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';

import PatientDetailsScreen from './src/screens/PatientDetailsScreen';
import TestInputScreen from './src/screens/TestInputScreen';
import TestManagementScreen from './src/screens/TestManagementScreen';
import ReportDetailsScreen from './src/screens/ReportDetailsScreen';
import ReportsListScreen from './src/screens/ReportsListScreen';

enableScreens();

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ReportsList"
        component={ReportsListScreen}
        options={{ title: 'Pathology Reports' }}
      />
      <Stack.Screen
        name="PatientDetails"
        component={PatientDetailsScreen}
        options={{ title: 'Patient Details' }}
      />
      <Stack.Screen
        name="TestInput"
        component={TestInputScreen}
        options={{ title: 'Test Results' }}
      />
      <Stack.Screen
        name="ReportDetails"
        component={ReportDetailsScreen}
        options={{ title: 'Report Details' }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              if (route.name === 'Home') {
                iconName = focused ? '📋' : '📄';
              } else if (route.name === 'Tests') {
                iconName = focused ? '🔬' : '🧪';
              }
              return <Text style={{ fontSize: size }}>{iconName}</Text>;
            },
            tabBarActiveTintColor: '#3498db',
            tabBarInactiveTintColor: 'gray',
            headerShown: false,
          })}
        >
          <Tab.Screen name="Home" component={HomeStack} />
          <Tab.Screen name="Tests" component={TestManagementScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
