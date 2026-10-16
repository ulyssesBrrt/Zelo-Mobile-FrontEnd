import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  Login: undefined;
  Cadastro: undefined;
  Home: undefined;
  ConfirmarDose: { medicationId?: string } | undefined;
  Medicamentos: undefined;
  CadastroMedicamento: undefined;
  Agenda: undefined;
  Historico: undefined;
  SOS: undefined;
  Perfil: undefined;
  Notificacoes: undefined;
};

export type CadastroScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Cadastro'
>;

export type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;

export type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

export type ConfirmarDoseScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ConfirmarDose'
>;

export type ConfirmarDoseScreenRouteProp = RouteProp<
  RootStackParamList,
  'ConfirmarDose'
>;
export type MedicamentosScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Medicamentos'
>;

export type MedicamentosScreenRouteProp = RouteProp<
  RootStackParamList,
  'Medicamentos'
>;

export type CadastroMedicamentoScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'CadastroMedicamento'
>;

export type CadastroMedicamentoScreenRouteProp = RouteProp<
  RootStackParamList,
  'CadastroMedicamento'
>;

export type AgendaScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Agenda'
>;

export type AgendaScreenRouteProp = RouteProp<
  RootStackParamList,
  'Agenda'
>;

export type SOSScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'SOS'
>;

export type SOSScreenRouteProp = RouteProp<
  RootStackParamList,
  'SOS'
>;

export type NotificacoesScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Notificacoes'
>;

export type NotificacoesScreenRouteProp = RouteProp<
  RootStackParamList,
  'Notificacoes'
>;

export type HistoricoScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Historico'
>;

export type HistoricoScreenRouteProp = RouteProp<
  RootStackParamList,
  'Historico'
>;

export type PerfilScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Perfil'
>;

export type PerfilScreenRouteProp = RouteProp<
  RootStackParamList,
  'Perfil'
>;

