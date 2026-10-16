import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  ActionSheetIOS,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { MedicamentosScreenNavigationProp, RootStackParamList } from '../../types/navigation';
import { MedicationItem, MedicationStatus } from '../../types/medication';
import { medicationService } from '../../services/medicationService';

export const MedicamentosScreen: React.FC = () => {
  const navigation = useNavigation<MedicamentosScreenNavigationProp>();

  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Carrega os medicamentos pelo serviço
  const loadMedications = useCallback(async () => {
    try {
      const data = await medicationService.getMedications();
      setMedications(data);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os medicamentos.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedications();
    // Se inscreve para atualizações automáticas e imediatas
    const unsubscribeService = medicationService.subscribe(() => {
      loadMedications();
    });
    // Atualiza também ao receber foco da tela
    const unsubscribeFocus = navigation.addListener('focus', () => {
      loadMedications();
    });

    return () => {
      unsubscribeService();
      unsubscribeFocus();
    };
  }, [loadMedications, navigation]);

  // Filtro de pesquisa pelo nome, dosagem ou forma
  const filteredMedications = useMemo(() => {
    if (!searchQuery.trim()) {
      return medications;
    }
    const query = searchQuery.toLowerCase().trim();
    return medications.filter(
      (med) =>
        med.nome.toLowerCase().includes(query) ||
        med.dosagem.toLowerCase().includes(query) ||
        med.forma.toLowerCase().includes(query)
    );
  }, [medications, searchQuery]);

  // Navegação consistente com tratamento seguro
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

  // Botão flutuante "+" para cadastro de medicamento
  const handleAddMedication = () => {
    navigation.navigate('CadastroMedicamento');
  };

  // Clique no card de medicamento
  const handleMedicationPress = (item: MedicationItem) => {
    Alert.alert(
      item.nome,
      `Dosagem: ${item.dosagem}\nForma: ${item.forma}\nPróximo horário: ${item.proximoHorario}\nStatus: ${item.status.toUpperCase()}\nEstoque atual: ${item.estoque} ${item.estoqueUnidade}`,
      [
        {
          text: 'Confirmar Dose',
          onPress: () => navigation.navigate('ConfirmarDose', { medicationId: item.id }),
        },
        { text: 'Fechar', style: 'cancel' },
      ]
    );
  };

  // Menu de 3 pontos com ações previstas (Ver Detalhes, Alterar Status, Excluir)
  const handleOpenMenu = (item: MedicationItem) => {
    const options = [
      'Ver Detalhes',
      'Marcar como Ativo 🟢',
      'Marcar como Pausa 🟡',
      'Marcar como Inativo 🔴',
      'Excluir Medicamento',
      'Cancelar',
    ];
    const destructiveIndex = 4;
    const cancelButtonIndex = 5;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: item.nome,
          message: 'Selecione uma ação para este medicamento',
          options,
          cancelButtonIndex,
          destructiveButtonIndex: destructiveIndex,
        },
        (buttonIndex) => {
          handleMenuAction(buttonIndex, item);
        }
      );
    } else {
      Alert.alert(
        item.nome,
        'Selecione uma ação para o medicamento:',
        [
          {
            text: 'Ver Detalhes',
            onPress: () => handleMedicationPress(item),
          },
          {
            text: 'Status: Ativo 🟢',
            onPress: () => changeStatus(item.id, 'ativo'),
          },
          {
            text: 'Status: Pausa 🟡',
            onPress: () => changeStatus(item.id, 'pausa'),
          },
          {
            text: 'Status: Inativo 🔴',
            onPress: () => changeStatus(item.id, 'inativo'),
          },
          {
            text: 'Excluir',
            style: 'destructive',
            onPress: () => deleteItem(item.id),
          },
          { text: 'Cancelar', style: 'cancel' },
        ]
      );
    }
  };

  const handleMenuAction = (index: number, item: MedicationItem) => {
    switch (index) {
      case 0:
        handleMedicationPress(item);
        break;
      case 1:
        changeStatus(item.id, 'ativo');
        break;
      case 2:
        changeStatus(item.id, 'pausa');
        break;
      case 3:
        changeStatus(item.id, 'inativo');
        break;
      case 4:
        deleteItem(item.id);
        break;
      default:
        break;
    }
  };

  const changeStatus = async (id: string, newStatus: MedicationStatus) => {
    try {
      await medicationService.updateMedicationStatus(id, newStatus);
      setMedications((prev) =>
        prev.map((med) => (med.id === id ? { ...med, status: newStatus } : med))
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar o status.');
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await medicationService.deleteMedication(id);
      setMedications((prev) => prev.filter((med) => med.id !== id));
      Alert.alert('Sucesso', 'Medicamento excluído com sucesso.');
    } catch {
      Alert.alert('Erro', 'Não foi possível excluir o medicamento.');
    }
  };

  // Helper para renderizar a imagem correta do medicamento baseado no tipo
  const getMedicationImage = (tipo: MedicationItem['tipo']) => {
    switch (tipo) {
      case 'gotas':
        return require('../../../assets/images/drops_bottle.png');
      case 'comprimido':
        return require('../../../assets/images/tablet_pill.png');
      case 'capsula':
      default:
        return require('../../../assets/images/capsule_pill.png');
    }
  };

  // Helper para configuração do Status Badge (Cor, Texto, Ponto de Status)
  const getStatusConfig = (status: MedicationStatus) => {
    switch (status) {
      case 'ativo':
        return {
          label: 'Ativo',
          dotColor: '#10B981', // Verde
          badgeBg: '#E8F5EE',  // Fundo verde claro suave
          textColor: '#047857',
        };
      case 'pausa':
        return {
          label: 'Pausa',
          dotColor: '#F59E0B', // Amarelo/Âmbar
          badgeBg: '#FEF3C7',  // Fundo amarelo claro suave
          textColor: '#B45309',
        };
      case 'inativo':
        return {
          label: 'Inativo',
          dotColor: '#EF4444', // Vermelho
          badgeBg: '#FEE2E2',  // Fundo vermelho claro suave
          textColor: '#B91C1C',
        };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Text style={styles.title}>Medicamentos</Text>
          <Text style={styles.subtitle}>Todos os medicamentos cadastrados.</Text>
        </View>

        {/* Campo de Pesquisa */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar medicamentos"
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Pesquisar medicamentos"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Lista com scroll vertical */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {filteredMedications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Feather name="search" size={40} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? `Nenhum medicamento encontrado para "${searchQuery}"`
                    : 'Nenhum medicamento cadastrado.'}
                </Text>
              </View>
            ) : (
              filteredMedications.map((item) => {
                const statusConfig = getStatusConfig(item.status);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.card}
                    activeOpacity={0.88}
                    onPress={() => handleMedicationPress(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Medicamento ${item.nome}, ${item.dosagem}, status ${statusConfig.label}`}
                  >
                    <View style={styles.cardTopRow}>
                      {/* Imagem do medicamento com fundo suave */}
                      <View style={styles.imageBox}>
                        <Image
                          source={getMedicationImage(item.tipo)}
                          style={styles.medicationImage}
                          resizeMode="contain"
                        />
                      </View>

                      {/* Informações centrais */}
                      <View style={styles.cardDetails}>
                        <View style={styles.nameRow}>
                          <Text style={styles.medicationName} numberOfLines={1}>
                            {item.nome}
                          </Text>
                          {/* Menu de três pontos */}
                          <TouchableOpacity
                            style={styles.menuButton}
                            activeOpacity={0.6}
                            onPress={() => handleOpenMenu(item)}
                            accessibilityRole="button"
                            accessibilityLabel={`Opções de ${item.nome}`}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                          >
                            <Feather name="more-vertical" size={20} color={COLORS.textSecondary} />
                          </TouchableOpacity>
                        </View>

                        {/* Dosagem e Forma */}
                        <Text style={styles.dosageText}>
                          {item.dosagem} • {item.forma}
                        </Text>

                        {/* Próximo Horário */}
                        <View style={styles.metaRow}>
                          <Feather
                            name="clock"
                            size={14}
                            color={COLORS.primary}
                            style={styles.metaIcon}
                          />
                          <Text style={styles.metaLabel}>Próximo horário:</Text>
                          <Text style={styles.metaValue}>{item.proximoHorario}</Text>
                        </View>

                        {/* Estoque */}
                        <View style={styles.metaRow}>
                          <Feather
                            name="archive"
                            size={14}
                            color={COLORS.primary}
                            style={styles.metaIcon}
                          />
                          <Text style={styles.metaLabel}>Estoque:</Text>
                          <Text style={styles.metaValue}>
                            {item.estoque} {item.estoqueUnidade}
                          </Text>
                        </View>

                        {/* Status Badge */}
                        <View style={styles.statusRow}>
                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: statusConfig.badgeBg },
                            ]}
                          >
                            <View
                              style={[
                                styles.statusDot,
                                { backgroundColor: statusConfig.dotColor },
                              ]}
                            />
                            <Text
                              style={[
                                styles.statusText,
                                { color: statusConfig.textColor },
                              ]}
                            >
                              {statusConfig.label}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        )}

        {/* Botão Flutuante "+" */}
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={handleAddMedication}
          accessibilityRole="button"
          accessibilityLabel="Adicionar novo medicamento"
        >
          <Feather name="plus" size={28} color={COLORS.white} />
        </TouchableOpacity>

        {/* Barra de Navegação Inferior Fixa */}
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

            {/* Tab: Medicamentos (Ativo nesta tela) */}
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 8,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 110, // Espaço para FAB e Barra inferior
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 14,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  imageBox: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  medicationImage: {
    width: 46,
    height: 46,
  },
  cardDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medicationName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 6,
  },
  menuButton: {
    padding: 4,
  },
  dosageText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaIcon: {
    marginRight: 6,
  },
  metaLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 96,
    right: 22,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
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
