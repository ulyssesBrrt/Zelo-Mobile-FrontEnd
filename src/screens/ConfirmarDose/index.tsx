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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import {
  ConfirmarDoseScreenNavigationProp,
  ConfirmarDoseScreenRouteProp,
  RootStackParamList,
} from '../../types/navigation';
import { ConfirmedDoseData } from '../../types/home';
import { medicationService } from '../../services/medicationService';

export const ConfirmarDoseScreen: React.FC = () => {
  const navigation = useNavigation<ConfirmarDoseScreenNavigationProp>();
  const route = useRoute<ConfirmarDoseScreenRouteProp>();

  const [doseData, setDoseData] = useState<ConfirmedDoseData | null>(null);

  // Carrega os dados dinâmicos da dose confirmada pelo serviço
  const loadDoseData = useCallback(async () => {
    try {
      const data = await medicationService.getConfirmedDoseData(
        route.params?.medicationId
      );
      setDoseData(data);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os dados da dose.');
    }
  }, [route.params?.medicationId]);

  useEffect(() => {
    loadDoseData();
  }, [loadDoseData]);

  // Navegação para rotas existentes ou feedback amigável para telas em desenvolvimento
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

  const handleVoltarInicio = () => {
    navigation.navigate('Home');
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
            <Text style={styles.headerTitle}>Dose confirmada</Text>

            {/* Ícone de Notificação */}
            <TouchableOpacity
              style={styles.notificationButton}
              activeOpacity={0.7}
              onPress={() => navigateTo('Notificacoes')}
              accessibilityRole="button"
              accessibilityLabel="Notificações"
            >
              <Feather name="bell" size={20} color={COLORS.textSecondary} />
              {doseData?.hasUnreadNotifications && (
                <View style={styles.notificationBadge} />
              )}
            </TouchableOpacity>
          </View>

          {/* Indicador visual de confirmação */}
          <View style={styles.confirmationBadgeContainer}>
            <View style={styles.outerCircle}>
              <View style={styles.innerCircle}>
                <Feather name="check" size={40} color={COLORS.white} />
              </View>
            </View>
            <Text style={styles.successMessage}>
              Dose registrada com sucesso.
            </Text>
          </View>

          {/* Card 1: Medicamento, quantidade e horário */}
          <View style={styles.card}>
            <View style={styles.pillIconBox}>
              <Image
                source={require('../../../assets/images/pilula00.png')}
                style={styles.capsuleImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.medicationInfo}>
              <Text style={styles.medicationName}>
                {doseData?.medicamentoNome || '—'}
              </Text>
              <Text style={styles.medicationQuantity}>
                {doseData?.quantidade || '—'}
              </Text>
              <View style={styles.timeRow}>
                <Feather
                  name="clock"
                  size={14}
                  color={COLORS.primary}
                  style={styles.timeIcon}
                />
                <Text style={styles.timeText}>
                  {doseData?.horarioDose || '—'}
                </Text>
              </View>
            </View>
          </View>

          {/* Card 2: Sua dose foi registrada no histórico. */}
          <View style={styles.card}>
            <View style={styles.iconBox}>
              <Feather name="file-text" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.historyMessage}>
              Sua dose foi registrada no histórico.
            </Text>
          </View>

          {/* Card 3: Próxima dose e horário */}
          <View style={styles.card}>
            <View style={styles.iconBox}>
              <Feather name="clock" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.nextDoseInfo}>
              <Text style={styles.nextDoseLabel}>Próxima dose</Text>
              <Text style={styles.nextDoseTime}>
                {doseData?.proximaDoseHorario || '—'}
              </Text>
            </View>
          </View>

          {/* Botão: ← Voltar para início */}
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.85}
            onPress={handleVoltarInicio}
            accessibilityRole="button"
            accessibilityLabel="Voltar para início"
          >
            <Feather
              name="arrow-left"
              size={18}
              color={COLORS.white}
              style={styles.backButtonIcon}
            />
            <Text style={styles.backButtonText}>Voltar para início</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Barra de Navegação Inferior Flutuante */}
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

            {/* Tab: Medicamentos (Destaque nesta tela no Figma) */}
            <TouchableOpacity
              style={styles.activeTabItem}
              activeOpacity={0.85}
              accessibilityRole="tab"
              accessibilityState={{ selected: true }}
              accessibilityLabel="Medicamentos"
            >
              <MaterialCommunityIcons
                name="pill"
                size={24}
                color={COLORS.primary}
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
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 100, // Espaço para a barra inferior flutuante
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  notificationButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
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
  confirmationBadgeContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  outerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E2F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  innerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successMessage: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 88,
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
  pillIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#D7F0DF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  capsuleImage: {
    width: 48,
    height: 48,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#D7F0DF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  medicationQuantity: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    marginRight: 6,
  },
  timeText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  historyMessage: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  nextDoseInfo: {
    flex: 1,
  },
  nextDoseLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  nextDoseTime: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  backButton: {
    width: '100%',
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  backButtonIcon: {
    marginRight: 8,
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
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
