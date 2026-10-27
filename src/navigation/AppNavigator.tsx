import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../context/AuthContext';

// Importações originais com as chaves mantidas!
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

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { user, isRestoring } = useAuth();

  // Enquanto lê o AsyncStorage, mostra a rodinha a carregar
  if (isRestoring) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3fa66bff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {user ? (
          // O utilizador tem sessão iniciada, vê as ecrãs da aplicação
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="ConfirmarDose" component={ConfirmarDoseScreen} />
            <Stack.Screen name="Medicamentos" component={MedicamentosScreen} />
            <Stack.Screen name="CadastroMedicamento" component={CadastroMedicamentoScreen} />
            <Stack.Screen name="Agenda" component={AgendaScreen} />
            <Stack.Screen name="SOS" component={SOSScreen} />
            <Stack.Screen name="Notificacoes" component={NotificacoesScreen} />
            <Stack.Screen name="Historico" component={HistoricoScreen} />
            <Stack.Screen name="Perfil" component={PerfilScreen} />
          </>
        ) : (
          // O utilizador não tem sessão, só vê Login ou Cadastro
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Cadastro" component={CadastroScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};