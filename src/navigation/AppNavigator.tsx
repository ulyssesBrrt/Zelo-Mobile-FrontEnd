import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CadastroScreen } from '../screens/Cadastro';
import { LoginScreen } from '../screens/Login';
import { HomeScreen } from '../screens/Home';
import { ConfirmarDoseScreen } from '../screens/ConfirmarDose';
import { MedicamentosScreen } from '../screens/Medicamentos';
import { CadastroMedicamentoScreen } from '../screens/CadastroMedicamento';
import { AgendaScreen } from '../screens/Agenda';
import { SOSScreen } from '../screens/SOS';
import { NotificacoesScreen } from '../screens/Notificacoes';
import { HistoricoScreen } from '../screens/Historico';
import { PerfilScreen } from '../screens/Perfil';
import { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Cadastro" component={CadastroScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ConfirmarDose" component={ConfirmarDoseScreen} />
        <Stack.Screen name="Medicamentos" component={MedicamentosScreen} />
        <Stack.Screen name="CadastroMedicamento" component={CadastroMedicamentoScreen} />
        <Stack.Screen name="Agenda" component={AgendaScreen} />
        <Stack.Screen name="SOS" component={SOSScreen} />
        <Stack.Screen name="Notificacoes" component={NotificacoesScreen} />
        <Stack.Screen name="Historico" component={HistoricoScreen} />
        <Stack.Screen name="Perfil" component={PerfilScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

