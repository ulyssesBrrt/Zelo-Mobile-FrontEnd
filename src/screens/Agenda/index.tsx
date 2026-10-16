import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  ActionSheetIOS,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { AgendaScreenNavigationProp, RootStackParamList } from '../../types/navigation';
import { MedicationItem } from '../../types/medication';
import { medicationService } from '../../services/medicationService';

const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const DIAS_SEMANA = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];

interface CalendarDay {
  dayNumber: number;
  isCurrentMonth: boolean;
  date: Date;
  dateString: string; // YYYY-MM-DD
}

export const AgendaScreen: React.FC = () => {
  const navigation = useNavigation<AgendaScreenNavigationProp>();

  // Data atual de referência
  const today = useMemo(() => new Date(), []);

  // Mês e ano atualmente visualizados no calendário (iniciando em Agosto de 2026 conforme Figma padrão ou data atual)
  // No protótipo do Figma está fixo como Agosto 2026. Permitimos navegar entre meses/anos.
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    // Inicializa em Agosto de 2026 para corresponder exatamente à referência visual do Figma
    return new Date(2026, 7, 1);
  });

  // Dia selecionado (null no estado inicial 1:487; preenchido ao clicar em um dia ou no botão "Hoje", ex: dia 18 no 1:624)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Medicamentos do dia selecionado
  const [scheduledMedications, setScheduledMedications] = useState<MedicationItem[]>([]);

  // Modal para escolher mês/ano
  const [isMonthPickerVisible, setIsMonthPickerVisible] = useState<boolean>(false);

  // Carrega medicamentos quando uma data for selecionada
  const loadMedicationsForSelectedDate = useCallback(async (date: Date) => {
    try {
      const list = await medicationService.getMedicationsByDate(date);
      setScheduledMedications(list);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os medicamentos da data.');
    }
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadMedicationsForSelectedDate(selectedDate);
    } else {
      setScheduledMedications([]);
    }
  }, [selectedDate, loadMedicationsForSelectedDate]);

  // Observer de alterações no cadastro de medicamentos
  useEffect(() => {
    const unsubscribe = medicationService.subscribe(() => {
      if (selectedDate) {
        loadMedicationsForSelectedDate(selectedDate);
      }
    });
    return () => unsubscribe();
  }, [selectedDate, loadMedicationsForSelectedDate]);

  // Gera a matriz 6x7 de dias do calendário começando de Segunda a Domingo
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Primeiro dia do mês
    const firstDayOfMonth = new Date(year, month, 1);
    // Dia da semana do primeiro dia (0=Dom, 1=Seg, ... 6=Sab)
    // Convertemos para formato Seg=0 ... Dom=6
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    // Último dia do mês
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const totalDaysInMonth = lastDayOfMonth.getDate();

    // Último dia do mês anterior
    const lastDayOfPrevMonth = new Date(year, month, 0).getDate();

    const days: CalendarDay[] = [];

    // Dias do mês anterior para completar a primeira semana
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = lastDayOfPrevMonth - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const dateString = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dayNumber: dayNum,
        isCurrentMonth: false,
        date: prevDate,
        dateString,
      });
    }

    // Dias do mês atual
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNumber: d,
        isCurrentMonth: true,
        date,
        dateString,
      });
    }

    // Dias do próximo mês para completar 42 células (6 semanas x 7 dias)
    const remainingDays = 42 - days.length;
    for (let next = 1; next <= remainingDays; next++) {
      const nextDate = new Date(year, month + 1, next);
      const dateString = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(next).padStart(2, '0')}`;
      days.push({
        dayNumber: next,
        isCurrentMonth: false,
        date: nextDate,
        dateString,
      });
    }

    return days;
  }, [currentDate]);

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

  // Clique em um dia do calendário
  const handleSelectDay = (day: CalendarDay) => {
    setSelectedDate(day.date);
    // Se o dia selecionado for de outro mês, ajusta o mês visualizado
    if (!day.isCurrentMonth) {
      setCurrentDate(new Date(day.date.getFullYear(), day.date.getMonth(), 1));
    }
  };

  // Botão "Hoje"
  const handleHojePress = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
  };

  // Formatação do título do mês e ano (ex: "Agosto 2026")
  const formattedMonthYear = `${MESES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  // Formatação do título do card detalhado (ex: "18 de agosto")
  const formattedSelectedDateTitle = useMemo(() => {
    if (!selectedDate) return '';
    const day = selectedDate.getDate();
    const monthName = MESES[selectedDate.getMonth()].toLowerCase();
    return `${day} de ${monthName}`;
  }, [selectedDate]);

  // Formatação do horário no padrão Figma (ex: "07h30")
  const formatTimeFigma = (timeStr: string) => {
    if (!timeStr) return '08h00';
    const clean = timeStr.trim().replace(':', 'h');
    if (clean.includes('h')) return clean;
    return `${clean}h00`;
  };

  // Menu de três pontos de cada medicamento na agenda
  const handleOpenMenu = (item: MedicationItem) => {
    const options = [
      'Ver Detalhes',
      'Confirmar Dose',
      'Alterar Horário',
      'Cancelar',
    ];
    const cancelButtonIndex = 3;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: item.nome,
          message: `${item.dosagem} • ${item.forma} às ${item.proximoHorario}`,
          options,
          cancelButtonIndex,
        },
        (btnIndex) => {
          if (btnIndex === 0) {
            Alert.alert(item.nome, `Dosagem: ${item.dosagem}\nForma: ${item.forma}\nHorário: ${item.proximoHorario}\nEstoque: ${item.estoque} ${item.estoqueUnidade}`);
          } else if (btnIndex === 1) {
            navigation.navigate('ConfirmarDose', { medicationId: item.id });
          } else if (btnIndex === 2) {
            Alert.alert('Horário', `O horário programado para ${item.nome} é ${item.proximoHorario}.`);
          }
        }
      );
    } else {
      Alert.alert(
        item.nome,
        `${item.dosagem} • ${item.forma} às ${item.proximoHorario}`,
        [
          {
            text: 'Ver Detalhes',
            onPress: () =>
              Alert.alert(item.nome, `Dosagem: ${item.dosagem}\nForma: ${item.forma}\nHorário: ${item.proximoHorario}\nEstoque: ${item.estoque} ${item.estoqueUnidade}`),
          },
          {
            text: 'Confirmar Dose',
            onPress: () => navigation.navigate('ConfirmarDose', { medicationId: item.id }),
          },
          { text: 'Fechar', style: 'cancel' },
        ]
      );
    }
  };

  // Navegação entre meses
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Cabeçalho Superior */}
          <View style={styles.header}>
            <Text style={styles.title}>Agenda</Text>
            <Text style={styles.subtitle}>Organize sua rotina de saúde.</Text>
          </View>

          {/* Barra de Mês/Ano e Botão "Hoje" */}
          <View style={styles.topBarRow}>
            {/* Seletor Mês e Ano */}
            <TouchableOpacity
              style={[
                styles.monthSelector,
                selectedDate ? styles.monthSelectorWithToday : styles.monthSelectorFull,
              ]}
              activeOpacity={0.75}
              onPress={() => setIsMonthPickerVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={`Mês e ano selecionados: ${formattedMonthYear}`}
            >
              <Text style={styles.monthSelectorText}>{formattedMonthYear}</Text>
            </TouchableOpacity>

            {/* Botão "Hoje" (Presente quando um dia estiver selecionado, conforme segunda referência Figma 1:624) */}
            {selectedDate && (
              <TouchableOpacity
                style={styles.todayButton}
                activeOpacity={0.75}
                onPress={handleHojePress}
                accessibilityRole="button"
                accessibilityLabel="Ir para hoje"
              >
                <Feather
                  name="calendar"
                  size={15}
                  color="#77B28C"
                  style={styles.todayIcon}
                />
                <Text style={styles.todayButtonText}>Hoje</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Calendário Mensal Card Branco */}
          <View style={styles.calendarCard}>
            {/* Linha dos Dias da Semana: SEG TER QUA QUI SEX SÁB DOM */}
            <View style={styles.weekdaysRow}>
              {DIAS_SEMANA.map((dia) => (
                <View key={dia} style={styles.weekdayCell}>
                  <Text style={styles.weekdayText}>{dia}</Text>
                </View>
              ))}
            </View>

            {/* Grid dos Dias do Mês (6 semanas de 7 dias) */}
            <View style={styles.daysGrid}>
              {Array.from({ length: 6 }).map((_, weekIndex) => (
                <View key={`week-${weekIndex}`} style={styles.weekRow}>
                  {calendarDays.slice(weekIndex * 7, weekIndex * 7 + 7).map((dayItem, dayIndex) => {
                    const isSelected =
                      selectedDate !== null &&
                      selectedDate.getFullYear() === dayItem.date.getFullYear() &&
                      selectedDate.getMonth() === dayItem.date.getMonth() &&
                      selectedDate.getDate() === dayItem.date.getDate();

                    const isLastCol = dayIndex === 6;
                    const isLastRow = weekIndex === 5;

                    return (
                      <TouchableOpacity
                        key={dayItem.dateString + dayIndex}
                        style={[
                          styles.dayCell,
                          !isLastCol && styles.cellBorderRight,
                          !isLastRow && styles.cellBorderBottom,
                        ]}
                        activeOpacity={0.65}
                        onPress={() => handleSelectDay(dayItem)}
                      >
                        {isSelected ? (
                          <View style={styles.selectedDayBadge}>
                            <Text style={styles.selectedDayText}>
                              {dayItem.dayNumber}
                            </Text>
                          </View>
                        ) : (
                          <Text
                            style={[
                              styles.dayNumberText,
                              !dayItem.isCurrentMonth && styles.otherMonthDayText,
                            ]}
                          >
                            {dayItem.dayNumber}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>

          {/* Estado Após Selecionar um Dia: Card de Medicamentos Programados (Figma 1:624) */}
          {selectedDate && (
            <View style={styles.detailsCard}>
              {/* Título com a data selecionada (ex: "18 de agosto") */}
              <Text style={styles.detailsDateTitle}>
                {formattedSelectedDateTitle}
              </Text>

              {/* Lista dos medicamentos ordenados por horário */}
              {scheduledMedications.length === 0 ? (
                <View style={styles.emptyDetailsContainer}>
                  <Text style={styles.emptyDetailsText}>
                    Nenhum medicamento programado para esta data.
                  </Text>
                </View>
              ) : (
                scheduledMedications.map((med) => (
                  <View key={med.id} style={styles.medicationRow}>
                    {/* Coluna da esquerda: Traço verde e horário */}
                    <View style={styles.timeColumn}>
                      <View style={styles.verticalGreenBar} />
                      <Text style={styles.timeText}>
                        {formatTimeFigma(med.proximoHorario)}
                      </Text>
                    </View>

                    {/* Coluna central: Ícone quadrado verde e Nome/Apresentação */}
                    <View style={styles.medInfoColumn}>
                      <View style={styles.pillIconBox}>
                        <MaterialCommunityIcons
                          name="pill"
                          size={14}
                          color="#77B28C"
                        />
                      </View>
                      <View style={styles.medTextWrapper}>
                        <Text style={styles.medNameText} numberOfLines={1}>
                          {med.nome}
                        </Text>
                        <Text style={styles.medFormaText} numberOfLines={1}>
                          {med.forma || med.dosagem}
                        </Text>
                      </View>
                    </View>

                    {/* Coluna da direita: Menu de 3 pontos */}
                    <TouchableOpacity
                      style={styles.moreButton}
                      activeOpacity={0.6}
                      onPress={() => handleOpenMenu(med)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      accessibilityRole="button"
                      accessibilityLabel={`Opções de ${med.nome}`}
                    >
                      <Feather
                        name="more-vertical"
                        size={15}
                        color="#B8C0BC"
                      />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>

        {/* Barra de Navegação Inferior Flutuante (com Agenda destacada em verde conforme Figma) */}
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

            {/* Tab: Agenda (Ativo nesta tela) */}
            <TouchableOpacity
              style={styles.activeTabItem}
              activeOpacity={0.85}
              accessibilityRole="tab"
              accessibilityState={{ selected: true }}
              accessibilityLabel="Agenda"
            >
              <Feather name="calendar" size={22} color={COLORS.primary} />
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

        {/* Modal de Navegação de Mês/Ano */}
        <Modal
          visible={isMonthPickerVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsMonthPickerVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsMonthPickerVisible(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={handlePrevMonth} style={styles.navArrow}>
                  <Feather name="chevron-left" size={20} color="#1E1E1E" />
                </TouchableOpacity>
                <Text style={styles.modalYearText}>{currentDate.getFullYear()}</Text>
                <TouchableOpacity onPress={handleNextMonth} style={styles.navArrow}>
                  <Feather name="chevron-right" size={20} color="#1E1E1E" />
                </TouchableOpacity>
              </View>

              <View style={styles.monthsGrid}>
                {MESES.map((m, idx) => {
                  const isCurMonth = currentDate.getMonth() === idx;
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.monthOption,
                        isCurMonth && styles.monthOptionActive,
                      ]}
                      onPress={() => {
                        setCurrentDate(new Date(currentDate.getFullYear(), idx, 1));
                        setIsMonthPickerVisible(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.monthOptionText,
                          isCurMonth && styles.monthOptionTextActive,
                        ]}
                      >
                        {m.substring(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
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
    paddingBottom: 120, // Espaço seguro para scroll sem cobrir a barra inferior
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
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    height: 40,
  },
  monthSelectorFull: {
    width: '100%',
  },
  monthSelectorWithToday: {
    flex: 1,
    marginRight: 14,
  },
  monthSelector: {
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  monthSelectorText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1E1E',
  },
  todayButton: {
    width: 76,
    height: 40,
    backgroundColor: '#C9E2D1',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayIcon: {
    marginRight: 6,
  },
  todayButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#77B28C',
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 12,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  weekdaysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    width: '100%',
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayText: {
    fontSize: 11.8,
    fontWeight: '700',
    color: '#77B28C',
  },
  daysGrid: {
    width: '100%',
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
  },
  dayCell: {
    flex: 1,
    height: 47,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellBorderRight: {
    borderRightWidth: 1,
    borderRightColor: '#E8ECEB',
  },
  cellBorderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECEB',
  },
  dayNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E1E1E',
  },
  otherMonthDayText: {
    color: '#B8C0BC',
  },
  selectedDayBadge: {
    width: 38,
    height: 38,
    backgroundColor: '#C9E2D1',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#77B28C',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 18,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  detailsDateTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  emptyDetailsContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyDetailsText: {
    fontSize: 12,
    color: '#5D6B63',
  },
  medicationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderTopWidth: 0.7,
    borderTopColor: '#E8ECEB',
  },
  timeColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 66,
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: '#E8ECEB',
  },
  verticalGreenBar: {
    width: 3,
    height: 20,
    backgroundColor: '#77B28C',
    borderRadius: 1.5,
    marginRight: 6,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#77B28C',
  },
  medInfoColumn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
  },
  pillIconBox: {
    width: 25,
    height: 25,
    backgroundColor: '#C9E2D1',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  medTextWrapper: {
    flex: 1,
  },
  medNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E1E1E',
  },
  medFormaText: {
    fontSize: 8,
    fontWeight: '400',
    color: '#5D6B63',
    marginTop: 1,
  },
  moreButton: {
    padding: 6,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navArrow: {
    padding: 8,
  },
  modalYearText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E1E1E',
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  monthOption: {
    width: '30%',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#F3F4F6',
  },
  monthOptionActive: {
    backgroundColor: '#C9E2D1',
  },
  monthOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E1E1E',
  },
  monthOptionTextActive: {
    color: '#77B28C',
    fontWeight: '700',
  },
});
