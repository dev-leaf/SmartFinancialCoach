import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAppTheme } from '../theme/Theme';
import { SCREEN_NAMES } from '../utils/constants';
import { AuthStackParamList } from './types';

/**
 * Auth Navigator
 * Stack navigation for unauthenticated users (Login/Register)
 */

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  const { colors } = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name={SCREEN_NAMES.LOGIN}
        getComponent={() => require('../screens/auth/LoginScreen').default}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen
        name={SCREEN_NAMES.REGISTER}
        getComponent={() => require('../screens/auth/RegisterScreen').default}
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
}
