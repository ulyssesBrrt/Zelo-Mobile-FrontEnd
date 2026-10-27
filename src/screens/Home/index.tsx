import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { HomeScreenNavigationProp, RootStackParamList } from '../../types/navigation';
import { HomeData } from '../../types/home';
import { medicationService } from '../../services/medicationService';
import { profileService } from '../../services/profileService';
import { sessionStore } from '../../services/sessionStore';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConfirmingDose, setIsConfirmingDose] = useState<boolean>(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  const loadHomeData = useCallback(async () => {
    try {
      const data = await medicationService.getHomeData();
      const userSession = await sessionStore.restore();
      const profile = await profileService.getProfile();

      const latestFoto =
        profile?.fotoUri ||
        (userSession as any)?.fotoUri ||
        data?.fotoUri ||
        data?.avatarUrl;

      setHomeData({
        ...data,
        fotoUri: latestFoto,
        avatarUrl: latestFoto,
      });
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os dados do medicamento.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [loadHomeData])
  );

  useEffect(() => {
    const unsubscribeMed = medicationService.subscribe(() => {
      loadHomeData();
    });
    const unsubscribeProfile = profileService.subscribe(() => {
      loadHomeData();
    });
    return () => {
      unsubscribeMed();
      unsubscribeProfile();
    };
  }, [loadHomeData]);

  // Cronómetro Regressivo em Tempo Real Sincronizado
  useEffect(() => {
    const targetTimestamp = homeData?.nextMedication?.proximaDoseTimestamp;

    if (!targetTimestamp) {
      setRemainingSeconds(0);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diffInSeconds = Math.max(0, Math.floor((targetTimestamp - now) / 1000));
      setRemainingSeconds(diffInSeconds);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [homeData?.nextMedication?.proximaDoseTimestamp]);

  const hours = String(Math.floor(remainingSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((remainingSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(remainingSeconds % 60).padStart(2, '0');

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

  const handleConfirmarDose = async () => {
    if (isConfirmingDose || !homeData?.nextMedication) {
      if (!homeData?.nextMedication) {
        Alert.alert('Aviso', 'Nenhum medicamento pendente para confirmação.');
      }
      return;
    }

    setIsConfirmingDose(true);
    try {
      const response = await medicationService.confirmDose(
        homeData.nextMedication.id
      );
      if (response.success) {
        navigation.navigate('ConfirmarDose', {
          medicationId: homeData.nextMedication.id,
        });
      }
    } catch {
      Alert.alert('Erro', 'Falha ao confirmar dose. Tente novamente.');
    } finally {
      setIsConfirmingDose(false);
    }
  };

  const avatarUri = homeData?.fotoUri || homeData?.avatarUrl;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Cabeçalho */}
          <View style={styles.header}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greetingText}>Bem vindo</Text>
              <Text style={styles.userNameText}>
                {homeData?.userName || ''}
              </Text>
            </View>

            <View style={styles.headerRight}>
              {/* Notificação */}
              <TouchableOpacity
                style={styles.notificationButton}
                activeOpacity={0.7}
                onPress={() => navigateTo('Notificacoes')}
                accessibilityRole="button"
                accessibilityLabel="Notificações"
              >
                <Feather name="bell" size={20} color={COLORS.textSecondary} />
                {homeData?.hasUnreadNotifications && (
                  <View style={styles.notificationBadge} />
                )}
              </TouchableOpacity>

              {/* Foto de perfil */}
              <TouchableOpacity
                style={styles.avatarButton}
                activeOpacity={0.8}
                onPress={() => navigateTo('Perfil')}
                accessibilityRole="button"
                accessibilityLabel="Perfil do usuário"
              >
                <Image
                  source={
                    avatarUri && avatarUri !== 'custom_photo_set'
                      ? { uri: avatarUri }
                      : require('../../../assets/images/user_avatar.png')
                  }
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Card: PRÓXIMO MEDICAMENTO */}
          <View style={styles.nextMedCard}>

            <View style={styles.nextMedTopRow}>
              <View style={styles.nextMedInfo}>
                <Text style={styles.nextMedBadge}>PRÓXIMO MEDICAMENTO</Text>
                <Text style={styles.nextMedName}>
                  {homeData?.nextMedication?.nome || 'Nenhum medicamento'}
                </Text>


                <View style={styles.timeBadgeContainer}>
                  <Feather
                    name="clock"
                    size={14}
                    color={COLORS.primaryDark}
                    style={styles.timeBadgeIcon}
                  />
                  <Text style={styles.timeBadgeText}>
                    {homeData?.nextMedication?.horario || '--:--'}
                  </Text>
                </View>


                <Text style={styles.countdownTitle}>
                  {homeData?.nextMedication
                    ? 'Falta para a sua próxima dose'
                    : 'Nenhuma dose programada'}
                </Text>


                <View style={styles.timerRow}>
                  <View style={styles.digitBox}>
                    <Text style={styles.digitText}>{hours}</Text>
                    <Text style={styles.unitText}>horas</Text>
                  </View>

                  <Text style={styles.timerSeparator}>:</Text>

                  <View style={styles.digitBox}>
                    <Text style={styles.digitText}>{minutes}</Text>
                    <Text style={styles.unitText}>minutos</Text>
                  </View>

                  <Text style={styles.timerSeparator}>:</Text>

                  <View style={styles.digitBox}>
                    <Text style={styles.digitText}>{seconds}</Text>
                    <Text style={styles.unitText}>segundos</Text>
                  </View>
                </View>
              </View>


              <View style={styles.illustrationContainer}>
                <Image
                  source={require('../../../assets/images/ILUSTRAÇÃO.png')}
                  style={styles.illustrationImage}
                  resizeMode="contain"
                />
              </View>
            </View>


            <TouchableOpacity
              style={[
                styles.confirmButton,
                isConfirmingDose && styles.confirmButtonDisabled,
              ]}
              activeOpacity={0.85}
              onPress={handleConfirmarDose}
              disabled={isConfirmingDose}
              accessibilityRole="button"
              accessibilityLabel="Confirmar dose"
            >
              {isConfirmingDose ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.confirmButtonText}>Confirmar dose</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Grid de 4 Cards: Medicamentos, Agenda, Histórico, SOS */}
          <View style={styles.gridContainer}>

            <View style={styles.gridRow}>

              <TouchableOpacity
                style={styles.featureCard}
                activeOpacity={0.8}
                onPress={() => navigateTo('Medicamentos')}
                accessibilityRole="button"
                accessibilityLabel="Medicamentos: Gerencie seus medicamentos"
              >
                <View style={styles.iconCircleGreen}>
                  <MaterialCommunityIcons
                    name="pill"
                    size={24}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.featureTitle}>Medicamentos</Text>
                <View style={styles.featureBottomRow}>
                  <Text style={styles.featureSubtitle}>
                    Gerencie seus{'\n'}medicamentos
                  </Text>
                  <Feather
                    name="arrow-right"
                    size={16}
                    color={COLORS.primary}
                    style={styles.featureArrow}
                  />
                </View>
              </TouchableOpacity>


              <TouchableOpacity
                style={styles.featureCard}
                activeOpacity={0.8}
                onPress={() => navigateTo('Agenda')}
                accessibilityRole="button"
                accessibilityLabel="Agenda: Veja suas consultas e horários"
              >
                <View style={styles.iconCircleGreen}>
                  <Feather name="calendar" size={22} color={COLORS.primary} />
                </View>
                <Text style={styles.featureTitle}>Agenda</Text>
                <View style={styles.featureBottomRow}>
                  <Text style={styles.featureSubtitle}>
                    Veja suas consultas{'\n'}e horários
                  </Text>
                  <Feather
                    name="arrow-right"
                    size={16}
                    color={COLORS.primary}
                    style={styles.featureArrow}
                  />
                </View>
              </TouchableOpacity>
            </View>


            <View style={styles.gridRow}>

              <TouchableOpacity
                style={styles.featureCard}
                activeOpacity={0.8}
                onPress={() => navigateTo('Historico')}
                accessibilityRole="button"
                accessibilityLabel="Histórico: Acompanhe seu histórico de uso"
              >
                <View style={styles.iconCircleGreen}>
                  <Feather name="rotate-ccw" size={22} color={COLORS.primary} />
                </View>
                <Text style={styles.featureTitle}>Histórico</Text>
                <View style={styles.featureBottomRow}>
                  <Text style={styles.featureSubtitle}>
                    Acompanhe seu{'\n'}histórico de uso
                  </Text>
                  <Feather
                    name="arrow-right"
                    size={16}
                    color={COLORS.primary}
                    style={styles.featureArrow}
                  />
                </View>
              </TouchableOpacity>


              <TouchableOpacity
                style={styles.featureCard}
                activeOpacity={0.8}
                onPress={() => navigateTo('SOS')}
                accessibilityRole="button"
                accessibilityLabel="SOS: Precisa de ajuda? Acesso rápido"
              >
                <View style={styles.iconCircleRed}>
                  <MaterialCommunityIcons
                    name="alarm-light-outline"
                    size={24}
                    color="#EF4444"
                  />
                </View>
                <Text style={styles.featureTitle}>SOS</Text>
                <View style={styles.featureBottomRow}>
                  <Text style={styles.featureSubtitle}>
                    Precisa de ajuda?{'\n'}Aceso rápido
                  </Text>
                  <Feather
                    name="arrow-right"
                    size={16}
                    color="#EF4444"
                    style={styles.featureArrow}
                  />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Barra de Navegação Inferior Flutuante */}
        <View style={styles.bottomBarContainer}>
          <View style={styles.bottomBar}>

            <TouchableOpacity
              style={styles.activeTabItem}
              activeOpacity={0.85}
              accessibilityRole="tab"
              accessibilityState={{ selected: true }}
              accessibilityLabel="Tela Principal"
            >
              <Feather name="home" size={22} color={COLORS.primary} />
            </TouchableOpacity>


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

export default HomeScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 4,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  userNameText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  nextMedCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#3fa66bff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  nextMedTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextMedInfo: {
    flex: 1,
    marginRight: 8,
  },
  nextMedBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  nextMedName: {
    fontSize: 21,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  timeBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1ECD7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  timeBadgeIcon: {
    marginRight: 5,
  },
  timeBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  countdownTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  digitBox: {
    alignItems: 'center',
  },
  digitText: {
    fontSize: 25,
    fontWeight: '700',
    color: '#4AA672',
    fontVariant: ['tabular-nums'],
    lineHeight: 28,
  },
  timerSeparator: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4AA672',
    marginHorizontal: 3,
    lineHeight: 26,
  },
  unitText: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  illustrationContainer: {
    width: 110,
    height: 165,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationImage: {
    width: 110,
    height: 165,
  },
  confirmButton: {
    width: '100%',
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  gridContainer: {
    width: '100%',
    marginTop: 4,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  featureCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 6,
    minHeight: 146,
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  iconCircleGreen: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#D7F0DF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleRed: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 10,
    marginBottom: 2,
  },
  featureBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  featureSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 15,
    flex: 1,
  },
  featureArrow: {
    marginLeft: 4,
    marginBottom: 2,
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
  activeTabItem: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#D7F0DF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabItem: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});