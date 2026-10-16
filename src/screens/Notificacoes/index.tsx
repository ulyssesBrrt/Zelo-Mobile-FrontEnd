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
import { NotificacoesScreenNavigationProp, RootStackParamList } from '../../types/navigation';
import { NotificationItem, NotificationType } from '../../types/notification';
import { notificationService } from '../../services/notificationService';

export const NotificacoesScreen: React.FC = () => {
  const navigation = useNavigation<NotificacoesScreenNavigationProp>();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Carrega as notificações do serviço
  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar as notificações.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();

    // Inscrição para atualizações em tempo real
    const unsubscribe = notificationService.subscribe(() => {
      loadNotifications();
    });

    return () => unsubscribe();
  }, [loadNotifications]);

  // Navegação consistente
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

  // Ao clicar em uma notificação, marca como lida e dá feedback correspondente
  const handleNotificationPress = async (item: NotificationItem) => {
    if (!item.lida) {
      await notificationService.markAsRead(item.id);
    }

    if (item.type === 'estoque_baixo') {
      Alert.alert(
        item.titulo,
        `${item.descricao}\n\nDeseja gerenciar seus medicamentos?`,
        [
          { text: 'Ver Medicamentos', onPress: () => navigation.navigate('Medicamentos') },
          { text: 'Fechar', style: 'cancel' },
        ]
      );
    } else if (item.type === 'hora_medicacao') {
      Alert.alert(
        item.titulo,
        `${item.descricao}\n\nHorário da dose agendada.`,
        [
          { text: 'Ver Agenda', onPress: () => navigation.navigate('Agenda') },
          { text: 'Confirmar Dose', onPress: () => navigation.navigate('ConfirmarDose') },
          { text: 'Fechar', style: 'cancel' },
        ]
      );
    } else {
      Alert.alert(
        item.titulo,
        `${item.descricao}\n${item.dataHorario}`,
        [
          { text: 'Ver Agenda', onPress: () => navigation.navigate('Agenda') },
          { text: 'Fechar', style: 'cancel' },
        ]
      );
    }
  };

  // Renderiza o ícone central do quadrado verde pastel #C9E2D1
  const renderNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'estoque_baixo':
        return <Feather name="package" size={20} color="#77B28C" />;
      case 'hora_medicacao':
        return <MaterialCommunityIcons name="pill" size={22} color="#77B28C" />;
      case 'consulta':
      default:
        return <MaterialCommunityIcons name="stethoscope" size={22} color="#77B28C" />;
    }
  };

  // Renderiza o ícone da linha de data/horário (relógio ou calendário)
  const renderTimeIcon = (type: NotificationType) => {
    if (type === 'estoque_baixo') {
      return (
        <Feather
          name="clock"
          size={10}
          color="#5D6B63"
          style={styles.timeIcon}
        />
      );
    }
    return (
      <Feather
        name="calendar"
        size={10}
        color="#5D6B63"
        style={styles.timeIcon}
      />
    );
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
            <Text style={styles.title}>Notificações</Text>
            <Text style={styles.subtitle}>
              Fique por dentro da sua rotina de saúde.
            </Text>
          </View>

          {/* Lista de Cards de Notificações */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="bell-off" size={36} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Nenhuma notificação no momento.</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {notifications.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  activeOpacity={0.8}
                  onPress={() => handleNotificationPress(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.titulo}: ${item.descricao}, ${item.dataHorario}`}
                >
                  {/* Ícone no quadrado arredondado verde suave #C9E2D1 */}
                  <View style={styles.iconBox}>
                    {renderNotificationIcon(item.type)}
                  </View>

                  {/* Informações: Título, Descrição, Data/Horário com ícone */}
                  <View style={styles.infoContainer}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.titulo}
                    </Text>
                    <Text style={styles.cardDescription} numberOfLines={1}>
                      {item.descricao}
                    </Text>
                    <View style={styles.timeRow}>
                      {renderTimeIcon(item.type)}
                      <Text style={styles.timeText}>{item.dataHorario}</Text>
                    </View>
                  </View>

                  {/* Indicador visual de notificação não lida (ponto verde suave do Figma) */}
                  {!item.lida && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Barra de Navegação Inferior Fixa - Padrão do projeto */}
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
    paddingBottom: 110, // Espaço para a barra inferior
  },
  header: {
    marginBottom: 24,
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
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  listContainer: {
    width: '100%',
  },
  card: {
    height: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: '#C9E2D1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E1E1E',
    lineHeight: 16,
  },
  cardDescription: {
    fontSize: 9.2,
    fontWeight: '500',
    color: '#5D6B63',
    lineHeight: 13,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  timeIcon: {
    marginRight: 3,
  },
  timeText: {
    fontSize: 9,
    fontWeight: '500',
    color: '#5D6B63',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#77B28C',
    marginLeft: 10,
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
