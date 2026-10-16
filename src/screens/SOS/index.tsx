import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { SOSScreenNavigationProp, RootStackParamList } from '../../types/navigation';
import { EmergencyContact } from '../../types/sos';
import { sosService } from '../../services/sosService';

export const SOSScreen: React.FC = () => {
  const navigation = useNavigation<SOSScreenNavigationProp>();

  const [contatoPrincipal, setContatoPrincipal] = useState<EmergencyContact | null>(null);
  const [samuInfo, setSamuInfo] = useState<{ nome: string; numero: string; rotulo: string }>(
    sosService.getSamuData()
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCalling, setIsCalling] = useState<boolean>(false);

  // Carrega os dados do contato de emergência do usuário
  const loadContacts = useCallback(async () => {
    try {
      setIsLoading(true);
      const contact = await sosService.getContatoPrincipal();
      setContatoPrincipal(contact);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os dados de contato de emergência.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  // Navegação consistente com as outras telas do projeto
  const navigateTo = (routeName: keyof RootStackParamList, params?: any) => {
    const routeNames = navigation.getState()?.routeNames || [];
    if (routeNames.includes(routeName)) {
      navigation.navigate(routeName as any, params);
    } else {
      Alert.alert(
        'Navegação',
        `A tela "${routeName}" foi preparada e será implementada posteriormente.`
      );
    }
  };

  // Botão vermelho grande: "Acionar SOS"
  const handleAcionarSos = async () => {
    if (isCalling) return;
    setIsCalling(true);

    try {
      await sosService.triggerSosAction();
    } catch {
      Alert.alert(
        'Falha no acionamento',
        'Ocorreu uma falha ao acionar a emergência. Você pode ligar diretamente tocando nos botões de chamada abaixo.'
      );
    } finally {
      setTimeout(() => {
        setIsCalling(false);
      }, 1500);
    }
  };

  // Botão "Ligar" para Contato Principal
  const handleLigarContatoPrincipal = async () => {
    if (!contatoPrincipal?.telefone) {
      Alert.alert('Aviso', 'Nenhum telefone cadastrado para o contato principal.');
      return;
    }
    await sosService.makePhoneCall(contatoPrincipal.telefone);
  };

  // Botão "Ligar" para SAMU (192)
  const handleLigarSamu = async () => {
    await sosService.makePhoneCall(samuInfo.numero);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Cabeçalho */}
          <View style={styles.header}>
            <Text style={styles.title}>S.O.S</Text>
            <Text style={styles.subtitle}>Precisa de ajuda?</Text>
          </View>

          {/* Botão Vermelho Grande: Acionar SOS */}
          <View style={styles.sosButtonContainer}>
            <TouchableOpacity
              style={[styles.sosButton, isCalling && styles.sosButtonDisabled]}
              activeOpacity={0.85}
              onPress={handleAcionarSos}
              disabled={isCalling}
              accessibilityRole="button"
              accessibilityLabel="Acionar SOS: Iniciar ligação de emergência para o SAMU e enviar mensagem de socorro no WhatsApp"
            >
              {/* Ícone de sirene/alerta dentro do círculo branco */}
              <View style={styles.sirenCircle}>
                <MaterialCommunityIcons
                  name="alarm-light-outline"
                  size={42}
                  color="#E42C24"
                />
              </View>

              {/* Texto "Acionar SOS" */}
              <Text style={styles.sosButtonText}>Acionar SOS</Text>
            </TouchableOpacity>
          </View>

          {/* Chamada de Alerta com Ícone e Texto Explicativo */}
          <View style={styles.alertBox}>
            <View style={styles.alertIconCircle}>
              <Feather name="alert-circle" size={18} color="#E42C24" />
            </View>
            <Text style={styles.alertText}>
              Toque no botão para entrar {'\n'}em contato com uma pessoa de emergência
            </Text>
          </View>

          {/* Seção: Contatos de emergência */}
          <View style={styles.contactsSection}>
            <Text style={styles.sectionTitle}>Contatos de emergência</Text>

            {/* Card 1: Contato Principal */}
            <View style={styles.contactCard}>
              {/* Ícone Avatar em fundo verde claro #C9E2D1 */}
              <View style={styles.avatarBoxGreen}>
                <Feather name="user" size={32} color="#77B28C" />
              </View>

              {/* Informações: Rótulo, Nome, Telefone com ícone */}
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>
                  {contatoPrincipal?.parentesco || 'Contato principal'}
                </Text>
                <Text style={styles.contactName} numberOfLines={1}>
                  {contatoPrincipal?.nome || 'Maria Pereira'}
                </Text>
                <View style={styles.phoneRow}>
                  <Feather
                    name="phone"
                    size={12}
                    color="#5D6B63"
                    style={styles.phoneIcon}
                  />
                  <Text style={styles.phoneText}>
                    {contatoPrincipal?.telefone || '(74) 9918-3421'}
                  </Text>
                </View>
              </View>

              {/* Botão "Ligar" verde suave com ícone */}
              <TouchableOpacity
                style={styles.callButtonGreen}
                activeOpacity={0.75}
                onPress={handleLigarContatoPrincipal}
                accessibilityRole="button"
                accessibilityLabel={`Ligar para ${contatoPrincipal?.nome || 'contato principal'}`}
              >
                <Feather
                  name="phone"
                  size={14}
                  color="#77B28C"
                  style={styles.callIcon}
                />
                <Text style={styles.callTextGreen}>Ligar</Text>
              </TouchableOpacity>
            </View>

            {/* Card 2: SAMU (192) */}
            <View style={styles.contactCard}>
              {/* Ícone Estrela da Vida / Emergência em fundo vermelho suave #F4ADAA */}
              <View style={styles.avatarBoxRed}>
                <MaterialCommunityIcons
                  name="hospital-box-outline"
                  size={32}
                  color="#E42C24"
                />
              </View>

              {/* Informações: Rótulo, Nome SAMU, Número 192 com ícone */}
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>{samuInfo.rotulo}</Text>
                <Text style={styles.contactName} numberOfLines={1}>
                  {samuInfo.nome}
                </Text>
                <View style={styles.phoneRow}>
                  <Feather
                    name="phone"
                    size={12}
                    color="#5D6B63"
                    style={styles.phoneIcon}
                  />
                  <Text style={styles.phoneText}>{samuInfo.numero}</Text>
                </View>
              </View>

              {/* Botão "Ligar" vermelho suave com ícone */}
              <TouchableOpacity
                style={styles.callButtonRed}
                activeOpacity={0.75}
                onPress={handleLigarSamu}
                accessibilityRole="button"
                accessibilityLabel="Ligar para o SAMU no número 192"
              >
                <Feather
                  name="phone"
                  size={14}
                  color="#E42C24"
                  style={styles.callIcon}
                />
                <Text style={styles.callTextRed}>Ligar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Barra de Navegação Inferior Fixa/Flutuante - Consistente com Home, Medicamentos e Agenda */}
        <View style={styles.bottomBarContainer}>
          <View style={styles.bottomBar}>
            {/* Tab: Home */}
            <TouchableOpacity
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => navigateTo('Home')}
              accessibilityRole="tab"
              accessibilityState={{ selected: false }}
              accessibilityLabel="Tela Principal"
            >
              <Feather name="home" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>

            {/* Tab: Medicamentos */}
            <TouchableOpacity
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => navigateTo('Medicamentos')}
              accessibilityRole="tab"
              accessibilityState={{ selected: false }}
              accessibilityLabel="Medicamentos"
            >
              <MaterialCommunityIcons
                name="pill"
                size={24}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>

            {/* Tab: Agenda */}
            <TouchableOpacity
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => navigateTo('Agenda')}
              accessibilityRole="tab"
              accessibilityState={{ selected: false }}
              accessibilityLabel="Agenda"
            >
              <Feather name="calendar" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>

            {/* Tab: Perfil */}
            <TouchableOpacity
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => navigateTo('Perfil')}
              accessibilityRole="tab"
              accessibilityState={{ selected: false }}
              accessibilityLabel="Perfil"
            >
              <Feather name="user" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 110, // Espaço para a barra de navegação inferior
  },
  header: {
    marginBottom: 26,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E1E1E',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5D6B63',
    lineHeight: 24,
    marginTop: 4,
  },
  sosButtonContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sosButton: {
    width: 250,
    height: 120,
    backgroundColor: '#E42C24',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#E42C24',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  sosButtonDisabled: {
    opacity: 0.75,
  },
  sirenCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  sosButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  alertBox: {
    alignItems: 'center',
    marginBottom: 28,
  },
  alertIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(244, 173, 170, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B5E5D',
    textAlign: 'center',
    lineHeight: 18,
  },
  contactsSection: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1E1E',
    lineHeight: 24,
    marginBottom: 14,
  },
  contactCard: {
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  avatarBoxGreen: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#C9E2D1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarBoxRed: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#F4ADAA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#5D6B63',
    lineHeight: 16,
    marginBottom: 2,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1E1E',
    lineHeight: 22,
    marginBottom: 2,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneIcon: {
    marginRight: 4,
  },
  phoneText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#5D6B63',
  },
  callButtonGreen: {
    backgroundColor: '#C9E2D1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  callTextGreen: {
    fontSize: 12,
    fontWeight: '600',
    color: '#77B28C',
    marginLeft: 4,
  },
  callButtonRed: {
    backgroundColor: '#F4ADAA',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  callTextRed: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E42C24',
    marginLeft: 4,
  },
  callIcon: {
    marginRight: 2,
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 12,
    left: 20,
    right: 20,
  },
  bottomBar: {
    height: 70,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  tabItem: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
