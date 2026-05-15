import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen from '../screens/HomeScreen';
import ClosetScreen from '../screens/ClosetScreen';
import AddItemScreen from '../screens/AddItemScreen';
import ColorMatchScreen from '../screens/ColorMatchScreen';
import OutfitResultScreen from '../screens/OutfitResultScreen';
import OnboardingScreen from '../screens/OnboardingScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function ClosetStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ClosetMain" component={ClosetScreen} options={{ title: '내 옷장' }} />
      <Stack.Screen name="AddItem" component={AddItemScreen} options={{ title: '옷 등록' }} />
    </Stack.Navigator>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ title: '홈' }} />
      <Stack.Screen name="ColorMatch" component={ColorMatchScreen} options={{ title: '컬러 매칭' }} />
      <Stack.Screen name="OutfitResult" component={OutfitResultScreen} options={{ title: '코디 추천' }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{ tabBarLabel: '홈', headerShown: false }}
      />
      <Tab.Screen
        name="Closet"
        component={ClosetStack}
        options={{ tabBarLabel: '내 옷장', headerShown: false }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator({ isOnboarded }) {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isOnboarded ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
