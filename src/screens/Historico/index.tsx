import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { HistoricoScreenNavigationProp, RootStackParamList } from '../../types/navigation';
import { DoseRecord, DayDoseSummary, PeriodDoseSummary, DoseStatus } from '../../types/history';
import { historyService } from '../../services/historyService';

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

type PeriodTab = 'hoje' | 'semana' | 'mes';

export const HistoricoScreen: React.FC = () => {
  const navigation = useNavigation<HistoricoScreenNavigationProp>();

  const [activeTab, setActiveTab] = useState<PeriodTab>('hoje');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Período de referência (Hoje / início da semana / mês)
  const [todayDate] = useState<Date>(new Date());
  const [weekStartDate, setWeekStartDate] = useState<Date>(() => {
    // Inicializa na semana com dias 13 a 19 para bater com o padrão de Agosto do Figma se em 2026, ou semana atual
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d;
  });
  const [monthDate, setMonthDate] = useState<Date>(() => new Date(2026, 7, 1));

  // Estados dos dados carregados
  const [todayRecords, setTodayRecords] = useState<DoseRecord[]>([]);
  const [todaySummary, setTodaySummary] = useState<PeriodDoseSummary>({ totalTomadas: 1, totalPendentes: 2, totalNaoTomadas: 1 });

  const [weekDays, setWeekDays] = useState<DayDoseSummary[]>([]);
  const [weekSummary, setWeekSummary] = useState<PeriodDoseSummary>({ totalTomadas: 11, totalPendentes: 3, totalNaoTomadas: 0 });

  const [monthDays, setMonthDays] = useState<DayDoseSummary[]>([]);
  const [monthSummary, setMonthSummary] = useState<PeriodDoseSummary>({ totalTomadas: 28, totalPendentes: 8, totalNaoTomadas: 2 });

  // Modal para detalhamento ao clicar em um dia específico na visão Semana ou Mês
  const [selectedDayDetail, setSelectedDayDetail] = useState<DayDoseSummary | null>(null);

  // Carrega os dados baseado na aba ativa
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'hoje') {
        const res = await historyService.getDayRecords(todayDate);
        setTodayRecords(res.records);
        setTodaySummary(res.summary);
      } else if (activeTab === 'semana') {
        const res = await historyService.getWeekSummary(weekStartDate);
        setWeekDays(res.days);
        setWeekSummary(res.summary);
      } else if (activeTab === 'mes') {
        const res = await historyService.getMonthSummary(monthDate.getFullYear(), monthDate.getMonth());
        setMonthDays(res.days);
        setMonthSummary(res.summary);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar o histórico de doses.');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, todayDate, weekStartDate, monthDate]);

  useEffect(() => {
    loadData();

    const unsubscribe = historyService.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [loadData]);

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

  // Navegação entre semanas (setas laterais da visão Semana)
  const handlePrevWeek = () => {
    setWeekStartDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() - 7);
      return next;
    });
  };

  const handleNextWeek = () => {
    setWeekStartDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + 7);
      return next;
    });
  };

  // Texto formatado do intervalo da semana (ex: "13 - 19 de agosto")
  const formattedWeekRange = useMemo(() => {
    const end = new Date(weekStartDate);
    end.setDate(weekStartDate.getDate() + 6);

    const startDay = weekStartDate.getDate();
    const endDay = end.getDate();
    const monthName = MESES[end.getMonth()].toLowerCase();

    return `${startDay} - ${endDay} de ${monthName}`;
  }, [weekStartDate]);

  // Navegação entre meses
  const handlePrevMonth = () => {
    setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const formattedMonthName = useMemo(() => {
    return `${MESES[monthDate.getMonth()]} de ${monthDate.getFullYear()}`;
  }, [monthDate]);

  // Badge de Status da Dose (Tomado / Pendente / Não tomado) conforme Figma
  const renderStatusBadge = (status: DoseStatus) => {
    if (status === 'tomado') {
      return (
        <View style={styles.badgeTomado}>
          <Feather name="check-circle" size={10} color="#77B28C" style={styles.badgeIcon} />
          <Text style={styles.badgeTextTomado}>Tomado</Text>
        </View>
      );
    }
    if (status === 'pendente') {
      return (
        <View style={styles.badgePendente}>
          <Feather name="clock" size={10} color="#F2B84B" style={styles.badgeIcon} />
          <Text style={styles.badgeTextPendente}>Pendente</Text>
        </View>
      );
    }
    return (
      <View style={styles.badgeNaoTomado}>
        <Feather name="x-circle" size={10} color="#E42C24" style={styles.badgeIcon} />
        <Text style={styles.badgeTextNaoTomado}>Não tomado</Text>
      </View>
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
            <Text style={styles.title}>Histórico</Text>
            <Text style={styles.subtitle}>Acompanhe suas medicações.</Text>
          </View>

          {/* Seletor de Período (Hoje, Semana, Mês) */}
          <View style={styles.periodTabsContainer}>
            {/* Aba Hoje */}
            <TouchableOpacity
              style={[
                styles.periodTab,
                activeTab === 'hoje' ? styles.periodTabActive : styles.periodTabInactive,
              ]}
              activeOpacity={0.8}
              onPress={() => setActiveTab('hoje')}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === 'hoje' }}
              accessibilityLabel="Filtro Hoje"
            >
              <Feather
                name="calendar"
                size={16}
                color={activeTab === 'hoje' ? '#77B28C' : '#B8C0BC'}
                style={styles.periodTabIcon}
              />
              <Text
                style={[
                  styles.periodTabText,
                  activeTab === 'hoje' ? styles.periodTabTextActive : styles.periodTabTextInactive,
                ]}
              >
                Hoje
              </Text>
            </TouchableOpacity>

            {/* Aba Semana */}
            <TouchableOpacity
              style={[
                styles.periodTab,
                activeTab === 'semana' ? styles.periodTabActive : styles.periodTabInactive,
              ]}
              activeOpacity={0.8}
              onPress={() => setActiveTab('semana')}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === 'semana' }}
              accessibilityLabel="Filtro Semana"
            >
              <Feather
                name="calendar"
                size={16}
                color={activeTab === 'semana' ? '#77B28C' : '#B8C0BC'}
                style={styles.periodTabIcon}
              />
              <Text
                style={[
                  styles.periodTabText,
                  activeTab === 'semana' ? styles.periodTabTextActive : styles.periodTabTextInactive,
                ]}
              >
                Semana
              </Text>
            </TouchableOpacity>

            {/* Aba Mês */}
            <TouchableOpacity
              style={[
                styles.periodTab,
                activeTab === 'mes' ? styles.periodTabActive : styles.periodTabInactive,
              ]}
              activeOpacity={0.8}
              onPress={() => setActiveTab('mes')}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === 'mes' }}
              accessibilityLabel="Filtro Mês"
            >
              <Feather
                name="calendar"
                size={16}
                color={activeTab === 'mes' ? '#77B28C' : '#B8C0BC'}
                style={styles.periodTabIcon}
              />
              <Text
                style={[
                  styles.periodTabText,
                  activeTab === 'mes' ? styles.periodTabTextActive : styles.periodTabTextInactive,
                ]}
              >
                Mês
              </Text>
            </TouchableOpacity>
          </View>

          {/* Controles de Navegação de Intervalo (Apenas para Semana ou Mês) */}
          {activeTab === 'semana' && (
            <View style={styles.rangeSelectorRow}>
              <TouchableOpacity
                onPress={handlePrevWeek}
                style={styles.arrowButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Semana anterior"
              >
                <Feather name="chevron-left" size={18} color="#1E1E1E" />
              </TouchableOpacity>
              <Text style={styles.rangeText}>{formattedWeekRange}</Text>
              <TouchableOpacity
                onPress={handleNextWeek}
                style={styles.arrowButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Próxima semana"
              >
                <Feather name="chevron-right" size={18} color="#1E1E1E" />
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'mes' && (
            <View style={styles.rangeSelectorRow}>
              <TouchableOpacity
                onPress={handlePrevMonth}
                style={styles.arrowButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Mês anterior"
              >
                <Feather name="chevron-left" size={18} color="#1E1E1E" />
              </TouchableOpacity>
              <Text style={styles.rangeText}>{formattedMonthName}</Text>
              <TouchableOpacity
                onPress={handleNextMonth}
                style={styles.arrowButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Próximo mês"
              >
                <Feather name="chevron-right" size={18} color="#1E1E1E" />
              </TouchableOpacity>
            </View>
          )}

          {/* Indicadores de Doses Tomadas e Doses Pendentes */}
          <View style={styles.summaryRow}>
            {/* Card Verde Claro: Doses tomadas */}
            <View style={styles.summaryCardGreen}>
              <View style={styles.circleIconWhite}>
                <Feather name="check-circle" size={22} color="#3FA66B" />
              </View>
              <Text style={styles.summaryLabel}>Doses tomadas</Text>
              <Text style={styles.summaryValueGreen}>
                {activeTab === 'hoje'
                  ? todaySummary.totalTomadas
                  : activeTab === 'semana'
                  ? weekSummary.totalTomadas
                  : monthSummary.totalTomadas}
              </Text>
            </View>

            {/* Card Amarelo Claro: Doses pendentes */}
            <View style={styles.summaryCardYellow}>
              <View style={styles.circleIconWhite}>
                <Feather name="clock" size={22} color="#F2B84B" />
              </View>
              <Text style={styles.summaryLabel}>Doses pendentes</Text>
              <Text style={styles.summaryValueYellow}>
                {activeTab === 'hoje'
                  ? todaySummary.totalPendentes
                  : activeTab === 'semana'
                  ? weekSummary.totalPendentes
                  : monthSummary.totalPendentes}
              </Text>
            </View>
          </View>

          {/* CONTEÚDO 1: ABA HOJE */}
          {activeTab === 'hoje' && (
            <View style={styles.recordsSection}>
              <Text style={styles.sectionTitle}>Registros de hoje</Text>

              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 20 }} />
              ) : todayRecords.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Nenhum registro de dose para hoje.</Text>
                </View>
              ) : (
                todayRecords.map((item) => (
                  <View key={item.id} style={styles.todayCard}>
                    {/* Horário */}
                    <Text style={styles.todayTimeText}>{item.horario}</Text>

                    {/* Divisor vertical */}
                    <View style={styles.todayDivider} />

                    {/* Ícone e Nome do Remédio */}
                    <View style={styles.todayMedContainer}>
                      <View style={styles.pillIconBox}>
                        <Image
                          source={require('../../../assets/images/pilula00.png')}
                          style={styles.pillImage}
                          resizeMode="contain"
                        />
                      </View>
                      <View style={styles.todayMedDetails}>
                        <Text style={styles.todayMedName} numberOfLines={1}>
                          {item.nome}
                        </Text>
                        <Text style={styles.todayMedQty} numberOfLines={1}>
                          {item.quantidade}
                        </Text>
                      </View>
                    </View>

                    {/* Badge de Status */}
                    {renderStatusBadge(item.status)}
                  </View>
                ))
              )}
            </View>
          )}

          {/* CONTEÚDO 2: ABA SEMANA */}
          {activeTab === 'semana' && (
            <View style={styles.weekContainer}>
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 20 }} />
              ) : (
                weekDays.map((dayItem, index) => {
                  const isFirst = index === 0;
                  const isLast = index === weekDays.length - 1;

                  return (
                    <TouchableOpacity
                      key={dayItem.data}
                      style={[
                        styles.weekDayRow,
                        isFirst && styles.weekDayRowFirst,
                        isLast && styles.weekDayRowLast,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => setSelectedDayDetail(dayItem)}
                      accessibilityRole="button"
                      accessibilityLabel={`${dayItem.diaSemanaLabel} dia ${dayItem.diaMes}: ${dayItem.tomados} tomados e ${dayItem.pendentes} pendentes`}
                    >
                      {/* Coluna Dia: SIGLA e Número */}
                      <View style={styles.weekDayCol}>
                        <Text style={styles.weekDayName}>{dayItem.diaSemanaLabel}</Text>
                        <Text style={styles.weekDayNumber}>{dayItem.diaMes}</Text>
                      </View>

                      {/* Divisor vertical */}
                      <View style={styles.weekDivider} />

                      {/* Tomados */}
                      <View style={styles.weekStatBox}>
                        <Feather name="check-circle" size={15} color="#77B28C" style={styles.statIcon} />
                        <Text style={styles.weekStatText}>{dayItem.tomados} tomados</Text>
                      </View>

                      {/* Pendentes (se houver) */}
                      <View style={styles.weekStatBox}>
                        {dayItem.pendentes > 0 && (
                          <>
                            <Feather name="clock" size={15} color="#F2B84B" style={styles.statIcon} />
                            <Text style={styles.weekStatText}>{dayItem.pendentes} pendente</Text>
                          </>
                        )}
                      </View>

                      {/* Seta para direita */}
                      <Feather name="chevron-right" size={16} color="#B8C0BC" />
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}

          {/* CONTEÚDO 3: ABA MÊS */}
          {activeTab === 'mes' && (
            <View style={styles.monthContainer}>
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 20 }} />
              ) : (
                monthDays.map((dayItem, index) => {
                  const isFirst = index === 0;
                  const isLast = index === monthDays.length - 1;

                  return (
                    <TouchableOpacity
                      key={dayItem.data}
                      style={[
                        styles.weekDayRow,
                        isFirst && styles.weekDayRowFirst,
                        isLast && styles.weekDayRowLast,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => setSelectedDayDetail(dayItem)}
                      accessibilityRole="button"
                      accessibilityLabel={`${dayItem.diaSemanaLabel} dia ${dayItem.diaMes}: ${dayItem.tomados} tomados e ${dayItem.pendentes} pendentes`}
                    >
                      {/* Coluna Dia: SIGLA e Número */}
                      <View style={styles.weekDayCol}>
                        <Text style={styles.weekDayName}>{dayItem.diaSemanaLabel}</Text>
                        <Text style={styles.weekDayNumber}>{dayItem.diaMes}</Text>
                      </View>

                      {/* Divisor vertical */}
                      <View style={styles.weekDivider} />

                      {/* Tomados */}
                      <View style={styles.weekStatBox}>
                        <Feather name="check-circle" size={15} color="#77B28C" style={styles.statIcon} />
                        <Text style={styles.weekStatText}>{dayItem.tomados} tomados</Text>
                      </View>

                      {/* Pendentes */}
                      <View style={styles.weekStatBox}>
                        {dayItem.pendentes > 0 && (
                          <>
                            <Feather name="clock" size={15} color="#F2B84B" style={styles.statIcon} />
                            <Text style={styles.weekStatText}>{dayItem.pendentes} pendente</Text>
                          </>
                        )}
                      </View>

                      {/* Seta para direita */}
                      <Feather name="chevron-right" size={16} color="#B8C0BC" />
                    </TouchableOpacity>
                  );
                })
              )}
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

        {/* Modal Detalhado de um Dia Selecionado na visão Semana/Mês */}
        <Modal
          visible={selectedDayDetail !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedDayDetail(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setSelectedDayDetail(null)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {selectedDayDetail ? `${selectedDayDetail.diaSemanaLabel}, dia ${selectedDayDetail.diaMes}` : ''}
                </Text>
                <TouchableOpacity onPress={() => setSelectedDayDetail(null)}>
                  <Feather name="x" size={20} color="#1E1E1E" />
                </TouchableOpacity>
              </View>

              {selectedDayDetail && selectedDayDetail.records.length === 0 ? (
                <Text style={styles.emptyDetailText}>Nenhum registro para este dia.</Text>
              ) : (
                selectedDayDetail?.records.map((r) => (
                  <View key={r.id} style={styles.detailCard}>
                    <Text style={styles.todayTimeText}>{r.horario}</Text>
                    <View style={styles.todayDivider} />
                    <View style={styles.todayMedContainer}>
                      <View style={styles.pillIconBox}>
                        <Image
                          source={require('../../../assets/images/pilula00.png')}
                          style={styles.pillImage}
                          resizeMode="contain"
                        />
                      </View>
                      <View style={styles.todayMedDetails}>
                        <Text style={styles.todayMedName} numberOfLines={1}>{r.nome}</Text>
                        <Text style={styles.todayMedQty} numberOfLines={1}>{r.quantidade}</Text>
                      </View>
                    </View>
                    {renderStatusBadge(r.status)}
                  </View>
                ))
              )}
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
    paddingBottom: 110,
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
  periodTabsContainer: {
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 16,
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
  periodTab: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  periodTabActive: {
    backgroundColor: '#C9E2D1',
  },
  periodTabInactive: {
    backgroundColor: '#FFFFFF',
  },
  periodTabIcon: {
    marginRight: 6,
  },
  periodTabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  periodTabTextActive: {
    color: '#77B28C',
  },
  periodTabTextInactive: {
    color: '#B8C0BC',
  },
  rangeSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  arrowButton: {
    padding: 6,
  },
  rangeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E1E1E',
    marginHorizontal: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryCardGreen: {
    width: '48%',
    height: 80,
    backgroundColor: '#E5F2E9',
    borderRadius: 12,
    paddingLeft: 14,
    paddingRight: 10,
    justifyContent: 'center',
    position: 'relative',
  },
  summaryCardYellow: {
    width: '48%',
    height: 80,
    backgroundColor: '#FFF5E4',
    borderRadius: 12,
    paddingLeft: 14,
    paddingRight: 10,
    justifyContent: 'center',
    position: 'relative',
  },
  circleIconWhite: {
    position: 'absolute',
    left: 14,
    top: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#5D6B63',
    marginLeft: 48,
    marginBottom: 2,
  },
  summaryValueGreen: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3FA66B',
    marginLeft: 48,
    lineHeight: 32,
  },
  summaryValueYellow: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F2B84B',
    marginLeft: 48,
    lineHeight: 32,
  },
  recordsSection: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1E1E',
    marginBottom: 14,
  },
  todayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  todayTimeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E1E1E',
    width: 40,
  },
  todayDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E8ECEB',
    marginHorizontal: 10,
  },
  todayMedContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillIconBox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: '#C9E2D1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  pillImage: {
    width: 20,
    height: 20,
  },
  todayMedDetails: {
    flex: 1,
  },
  todayMedName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E1E1E',
  },
  todayMedQty: {
    fontSize: 9,
    fontWeight: '600',
    color: '#5D6B63',
    marginTop: 1,
  },
  badgeTomado: {
    backgroundColor: '#C9E2D1',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  badgePendente: {
    backgroundColor: '#FFF5E4',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  badgeNaoTomado: {
    backgroundColor: '#F4ADAA',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  badgeIcon: {
    marginRight: 4,
  },
  badgeTextTomado: {
    fontSize: 10,
    fontWeight: '600',
    color: '#77B28C',
  },
  badgeTextPendente: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F2B84B',
  },
  badgeTextNaoTomado: {
    fontSize: 10,
    fontWeight: '600',
    color: '#E42C24',
  },
  weekContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
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
  monthContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
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
  weekDayRow: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 0.6,
    borderBottomColor: '#F3F4F6',
  },
  weekDayRowFirst: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  weekDayRowLast: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomWidth: 0,
  },
  weekDayCol: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayName: {
    fontSize: 8,
    fontWeight: '600',
    color: '#1E1E1E',
  },
  weekDayNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E1E1E',
    lineHeight: 18,
  },
  weekDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E8ECEB',
    marginHorizontal: 12,
  },
  weekStatBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    marginRight: 6,
  },
  weekStatText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#1E1E1E',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '60%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1E1E',
  },
  emptyDetailText: {
    fontSize: 13,
    color: '#5D6B63',
    textAlign: 'center',
    marginVertical: 20,
  },
  detailCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
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
