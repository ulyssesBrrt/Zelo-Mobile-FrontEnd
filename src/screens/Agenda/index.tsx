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
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { AgendaScreenNavigationProp, RootStackParamList } from '../../types/navigation';
import { MedicationItem } from '../../types/medication';
import { medicationService } from '../../services/medicationService';
import { calendarService } from '../../services/calendarService';
import { agendaService } from '../../services/agendaService';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const DIAS_SEMANA = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];

interface CalendarDay {
  dayNumber: number;
  isCurrentMonth: boolean;
  date: Date;
  dateString: string;
}

export const AgendaScreen: React.FC = () => {
  const navigation = useNavigation<AgendaScreenNavigationProp>();

  // Visualização e Seleção do Calendário
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date(2026, 7, 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Lista unificada de eventos do dia selecionado
  const [scheduledMedications, setScheduledMedications] = useState<MedicationItem[]>([]);

  // Modais de Mês e de Cadastro
  const [isMonthPickerVisible, setIsMonthPickerVisible] = useState<boolean>(false);
  const [isAddEventModalVisible, setIsAddEventModalVisible] = useState<boolean>(false);

  // Tipo de Compromisso: 'consulta' | 'exame'
  const [eventType, setEventType] = useState<'consulta' | 'exame'>('consulta');

  // Campos - Consulta
  const [nomeClinica, setNomeClinica] = useState('');
  const [medicoConsulta, setMedicoConsulta] = useState('');
  const [especialidadeConsulta, setEspecialidadeConsulta] = useState('');

  // Campos - Exame
  const [laboratorio, setLaboratorio] = useState('');
  const [tipoExame, setTipoExame] = useState('');
  const [medicoSolicitante, setMedicoSolicitante] = useState('');

  // Entrada de Data e Hora com Máscara de Números
  const [dataInput, setDataInput] = useState('');
  const [horarioInput, setHorarioInput] = useState('09:00');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formata Date para DD/MM/AAAA
  const formatDateToBR = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Exibe estritamente Apenas Hora e Minutos (HH:MM), removendo segundos
  const formatTimeFigma = (timeStr: string) => {
    if (!timeStr) return '08:00';
    const clean = timeStr.trim().replace('h', ':');
    const parts = clean.split(':');
    if (parts.length >= 2) {
      const hours = parts[0].padStart(2, '0');
      const minutes = parts[1].padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    return clean;
  };

  // Máscara automática de data (DD/MM/AAAA)
  const handleDataChangeText = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 8);
    let formatted = cleaned;
    if (cleaned.length > 4) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    } else if (cleaned.length > 2) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    setDataInput(formatted);
  };

  // Máscara automática de horário (HH:MM)
  const handleHorarioChangeText = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}`;
    }
    setHorarioInput(formatted);
  };

  // Converte DD/MM/AAAA e HH:MM para ISO Spring Boot (YYYY-MM-DDTHH:mm:ss)
  const parseToISOString = (dateStr: string, timeStr: string): string | null => {
    const cleanDate = dateStr.trim();
    const cleanTime = timeStr.trim();

    const dateParts = cleanDate.split('/');
    if (dateParts.length !== 3) return null;

    const day = dateParts[0].padStart(2, '0');
    const month = dateParts[1].padStart(2, '0');
    const year = dateParts[2];

    if (day.length !== 2 || month.length !== 2 || year.length !== 4) return null;

    const timeParts = cleanTime.split(':');
    if (timeParts.length !== 2) return null;

    const hours = timeParts[0].padStart(2, '0');
    const minutes = timeParts[1].padStart(2, '0');

    if (hours.length !== 2 || minutes.length !== 2) return null;

    return `${year}-${month}-${day}T${hours}:${minutes}:00`;
  };

  const resetEventForm = () => {
    setNomeClinica('');
    setMedicoConsulta('');
    setEspecialidadeConsulta('');
    setLaboratorio('');
    setTipoExame('');
    setMedicoSolicitante('');

    const targetDate = selectedDate || new Date();
    setDataInput(formatDateToBR(targetDate));
    setHorarioInput('09:00');
    setEventType('consulta');
  };

  // Carrega itens do dia selecionado
  const loadMedicationsForSelectedDate = useCallback(async (date: Date) => {
    try {
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      // 1. Medicamentos
      const medList = await medicationService.getMedicationsByDate(date);

      // 2. Agendamentos do Backend Spring Boot
      let backendItems: MedicationItem[] = [];
      try {
        const agendamentos = await agendaService.getAgendamentos();
        backendItems = agendamentos
          .filter((ag) => ag.dataHorario && ag.dataHorario.startsWith(dateStr))
          .map((ag) => ({
            id: `agendamento-${ag.id}`,
            nome: ag.tipo === 'CONSULTA' ? (ag.nomeClinica || 'Consulta') : (ag.laboratorio || 'Exame'),
            dosagem: ag.tipo === 'CONSULTA' ? `Dr(a). ${ag.medico || 'Não informado'}` : `Solicitante: ${ag.medicoSolicitante || 'Não informado'}`,
            forma: ag.tipo === 'CONSULTA' ? (ag.especialidade || 'Consulta Médica') : (ag.tipoExame || 'Exame Laboratorial'),
            tipo: 'comprimido' as const,
            viaAdministracao: '',
            proximoHorario: ag.dataHorario ? ag.dataHorario.substring(11, 16) : '09:00',
            estoque: 1,
            estoqueUnidade: 'unidades',
            status: 'ativo' as const,
          }));
      } catch (e) {
        console.error('Erro ao buscar do backend:', e);
      }

      // 3. Eventos do calendarService
      let eventItems: MedicationItem[] = [];
      try {
        const events = await calendarService.getEvents();
        eventItems = events
          .filter((ev) => ev.dataHora && ev.dataHora.startsWith(dateStr))
          .map((ev) => ({
            id: `event-${ev.id}`,
            nome: ev.titulo,
            dosagem: ev.local || 'Consulta',
            forma: ev.local || ev.tipo || 'Consulta / Exame',
            tipo: 'comprimido' as const,
            viaAdministracao: '',
            proximoHorario: ev.dataHora ? ev.dataHora.substring(11, 16) : '09:00',
            estoque: 1,
            estoqueUnidade: 'unidades',
            status: 'ativo' as const,
          }));
      } catch (e) {
        // Ignora falhas se a lista estiver vazia
      }

      const combined = [...medList, ...backendItems, ...eventItems].sort((a, b) => {
        const timeA = formatTimeFigma(a.proximoHorario || '00:00');
        const timeB = formatTimeFigma(b.proximoHorario || '00:00');
        return timeA.localeCompare(timeB);
      });

      setScheduledMedications(combined);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os dados da data.');
    }
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadMedicationsForSelectedDate(selectedDate);
    } else {
      setScheduledMedications([]);
    }
  }, [selectedDate, loadMedicationsForSelectedDate]);

  useEffect(() => {
    const unsubscribeMeds = medicationService.subscribe(() => {
      if (selectedDate) loadMedicationsForSelectedDate(selectedDate);
    });
    const unsubscribeCal = calendarService.subscribe(() => {
      if (selectedDate) loadMedicationsForSelectedDate(selectedDate);
    });
    return () => {
      unsubscribeMeds();
      unsubscribeCal();
    };
  }, [selectedDate, loadMedicationsForSelectedDate]);

  // Envio ao Spring Boot
  const handleSalvarAgendamento = async () => {
    if (isSubmitting) return;

    if (eventType === 'consulta' && !nomeClinica.trim()) {
      Alert.alert('Campo obrigatório', 'Por favor, informe a clínica/hospital.');
      return;
    }

    if (eventType === 'exame' && !laboratorio.trim()) {
      Alert.alert('Campo obrigatório', 'Por favor, informe o laboratório.');
      return;
    }

    const isoDateTime = parseToISOString(dataInput, horarioInput);
    if (!isoDateTime) {
      Alert.alert(
        'Data ou Horário inválido',
        'Informe a data completa no formato DD/MM/AAAA e o horário no formato HH:MM.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (eventType === 'consulta') {
        await agendaService.createAgendamento({
          tipo: 'CONSULTA',
          nomeClinica: nomeClinica.trim(),
          medico: medicoConsulta.trim(),
          especialidade: especialidadeConsulta.trim(),
          dataHorario: isoDateTime,
        });
      } else {
        await agendaService.createAgendamento({
          tipo: 'EXAME',
          laboratorio: laboratorio.trim(),
          tipoExame: tipoExame.trim(),
          medicoSolicitante: medicoSolicitante.trim(),
          dataHorario: isoDateTime,
        });
      }

      Alert.alert('Sucesso', `${eventType === 'consulta' ? 'Consulta' : 'Exame'} cadastrado com sucesso!`);
      setIsAddEventModalVisible(false);
      resetEventForm();

      if (selectedDate) {
        loadMedicationsForSelectedDate(selectedDate);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar o agendamento no servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const lastDayOfMonth = new Date(year, month + 1, 0);
    const totalDaysInMonth = lastDayOfMonth.getDate();
    const lastDayOfPrevMonth = new Date(year, month, 0).getDate();

    const days: CalendarDay[] = [];

    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = lastDayOfPrevMonth - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const dateString = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({ dayNumber: dayNum, isCurrentMonth: false, date: prevDate, dateString });
    }

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dayNumber: d, isCurrentMonth: true, date, dateString });
    }

    const remainingDays = 42 - days.length;
    for (let next = 1; next <= remainingDays; next++) {
      const nextDate = new Date(year, month + 1, next);
      const dateString = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(next).padStart(2, '0')}`;
      days.push({ dayNumber: next, isCurrentMonth: false, date: nextDate, dateString });
    }

    return days;
  }, [currentDate]);

  const navigateTo = (routeName: keyof RootStackParamList, params?: any) => {
    const routeNames = navigation.getState()?.routeNames || [];
    if (routeNames.includes(routeName)) {
      navigation.navigate(routeName as any, params);
    } else {
      Alert.alert('Navegação', `A tela "${routeName}" será implementada em breve.`);
    }
  };

  const handleSelectDay = (day: CalendarDay) => {
    setSelectedDate(day.date);
    if (!day.isCurrentMonth) {
      setCurrentDate(new Date(day.date.getFullYear(), day.date.getMonth(), 1));
    }
  };

  const handleHojePress = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
  };

  const formattedMonthYear = `${MESES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  const formattedSelectedDateTitle = useMemo(() => {
    if (!selectedDate) return '';
    const day = selectedDate.getDate();
    const monthName = MESES[selectedDate.getMonth()].toLowerCase();
    return `${day} de ${monthName}`;
  }, [selectedDate]);

  const handleOpenMenu = (item: MedicationItem) => {
    const formattedTime = formatTimeFigma(item.proximoHorario);
    const options = ['Ver Detalhes', 'Cancelar'];
    const cancelButtonIndex = 1;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: item.nome,
          message: `${item.dosagem}\n${item.forma} às ${formattedTime}`,
          options,
          cancelButtonIndex,
        },
        (btnIndex) => {
          if (btnIndex === 0) {
            Alert.alert(item.nome, `Detalhes: ${item.dosagem}\nHorário: ${formattedTime}`);
          }
        }
      );
    } else {
      Alert.alert(
        item.nome,
        `${item.dosagem}\n${item.forma} às ${formattedTime}`,
        [
          { text: 'Ver Detalhes', onPress: () => Alert.alert(item.nome, `Detalhes: ${item.dosagem}\nHorário: ${formattedTime}`) },
          { text: 'Fechar', style: 'cancel' },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Cabeçalho */}
          <View style={styles.header}>
            <Text style={styles.title}>Agenda</Text>
            <Text style={styles.subtitle}>Organize sua rotina de saúde.</Text>
          </View>

          {/* Botão Cadastrar Compromisso */}
          <TouchableOpacity
            style={styles.saveButton}
            activeOpacity={0.85}
            onPress={() => {
              resetEventForm();
              setIsAddEventModalVisible(true);
            }}
          >
            <Feather name="plus-circle" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.saveButtonText}>Cadastrar compromisso</Text>
          </TouchableOpacity>

          {/* Mês/Ano e Hoje */}
          <View style={styles.topBarRow}>
            <TouchableOpacity
              style={[
                styles.monthSelector,
                selectedDate ? styles.monthSelectorWithToday : styles.monthSelectorFull,
              ]}
              activeOpacity={0.75}
              onPress={() => setIsMonthPickerVisible(true)}
            >
              <Text style={styles.monthSelectorText}>{formattedMonthYear}</Text>
            </TouchableOpacity>

            {selectedDate && (
              <TouchableOpacity
                style={styles.todayButton}
                activeOpacity={0.75}
                onPress={handleHojePress}
              >
                <Feather name="calendar" size={15} color="#77B28C" style={styles.todayIcon} />
                <Text style={styles.todayButtonText}>Hoje</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Grid do Calendário */}
          <View style={styles.calendarCard}>
            <View style={styles.weekdaysRow}>
              {DIAS_SEMANA.map((dia) => (
                <View key={dia} style={styles.weekdayCell}>
                  <Text style={styles.weekdayText}>{dia}</Text>
                </View>
              ))}
            </View>

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
                            <Text style={styles.selectedDayText}>{dayItem.dayNumber}</Text>
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

          {/* Lista do Dia */}
          {selectedDate && (
            <View style={styles.detailsCard}>
              <Text style={styles.detailsDateTitle}>{formattedSelectedDateTitle}</Text>

              {scheduledMedications.length === 0 ? (
                <View style={styles.emptyDetailsContainer}>
                  <Text style={styles.emptyDetailsText}>
                    Nenhum compromisso ou medicamento para esta data.
                  </Text>
                </View>
              ) : (
                scheduledMedications.map((med) => (
                  <View key={med.id} style={styles.medicationRow}>
                    <View style={styles.timeColumn}>
                      <View style={styles.verticalGreenBar} />
                      <Text style={styles.timeText}>{formatTimeFigma(med.proximoHorario)}</Text>
                    </View>

                    <View style={styles.medInfoColumn}>
                      <View style={styles.pillIconBox}>
                        <MaterialCommunityIcons name="pill" size={14} color="#77B28C" />
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

                    <TouchableOpacity
                      style={styles.moreButton}
                      activeOpacity={0.6}
                      onPress={() => handleOpenMenu(med)}
                    >
                      <Feather name="more-vertical" size={15} color="#B8C0BC" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>

        {/* NAVEGAÇÃO INFERIOR */}
        <View style={styles.bottomBarContainer}>
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.tabItem} onPress={() => navigateTo('Home')}>
              <Feather name="home" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabItem} onPress={() => navigateTo('Medicamentos')}>
              <MaterialCommunityIcons name="pill" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.activeTabItem}>
              <Feather name="calendar" size={22} color={COLORS.primary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabItem} onPress={() => navigateTo('Perfil')}>
              <Feather name="user" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* POP-UP MODAL: CADASTRO DE CONSULTA / EXAME */}
        <Modal
          visible={isAddEventModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsAddEventModalVisible(false)}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <Text style={styles.modalTitleText}>Cadastrar compromisso</Text>
                <TouchableOpacity onPress={() => setIsAddEventModalVisible(false)}>
                  <Feather name="x" size={22} color="#5D6B63" />
                </TouchableOpacity>
              </View>

              {/* Seletor Consulta / Exame */}
              <View style={styles.typeSelectorRow}>
                <TouchableOpacity
                  style={[
                    styles.typeSelectorButton,
                    eventType === 'consulta' && styles.typeSelectorButtonActive,
                  ]}
                  onPress={() => setEventType('consulta')}
                >
                  <Text
                    style={[
                      styles.typeSelectorText,
                      eventType === 'consulta' && styles.typeSelectorTextActive,
                    ]}
                  >
                    Consulta
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeSelectorButton,
                    eventType === 'exame' && styles.typeSelectorButtonActive,
                  ]}
                  onPress={() => setEventType('exame')}
                >
                  <Text
                    style={[
                      styles.typeSelectorText,
                      eventType === 'exame' && styles.typeSelectorTextActive,
                    ]}
                  >
                    Exame
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
                {eventType === 'consulta' ? (
                  <>
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Nome clínica / hospital *</Text>
                      <View style={styles.inputBox}>
                        <TextInput
                          style={styles.textInput}
                          placeholder="Ex: Hospital São Lucas"
                          placeholderTextColor="#5D6B63"
                          value={nomeClinica}
                          onChangeText={setNomeClinica}
                        />
                      </View>
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Médicos</Text>
                      <View style={styles.inputBox}>
                        <TextInput
                          style={styles.textInput}
                          placeholder="Ex: Dr. Roberto Silva"
                          placeholderTextColor="#5D6B63"
                          value={medicoConsulta}
                          onChangeText={setMedicoConsulta}
                        />
                      </View>
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Especialidade</Text>
                      <View style={styles.inputBox}>
                        <TextInput
                          style={styles.textInput}
                          placeholder="Ex: Cardiologia"
                          placeholderTextColor="#5D6B63"
                          value={especialidadeConsulta}
                          onChangeText={setEspecialidadeConsulta}
                        />
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Laboratório *</Text>
                      <View style={styles.inputBox}>
                        <TextInput
                          style={styles.textInput}
                          placeholder="Ex: Laboratório Fleury"
                          placeholderTextColor="#5D6B63"
                          value={laboratorio}
                          onChangeText={setLaboratorio}
                        />
                      </View>
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Tipo / Especialidade</Text>
                      <View style={styles.inputBox}>
                        <TextInput
                          style={styles.textInput}
                          placeholder="Ex: Hemograma completo"
                          placeholderTextColor="#5D6B63"
                          value={tipoExame}
                          onChangeText={setTipoExame}
                        />
                      </View>
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Médico solicitante</Text>
                      <View style={styles.inputBox}>
                        <TextInput
                          style={styles.textInput}
                          placeholder="Ex: Dra. Ana Paula"
                          placeholderTextColor="#5D6B63"
                          value={medicoSolicitante}
                          onChangeText={setMedicoSolicitante}
                        />
                      </View>
                    </View>
                  </>
                )}

                {/* Campos com máscara numérica de Data e Horário */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Data *</Text>
                    <View style={styles.inputBox}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="DD/MM/AAAA"
                        placeholderTextColor="#5D6B63"
                        value={dataInput}
                        onChangeText={handleDataChangeText}
                        keyboardType="number-pad"
                        maxLength={10}
                      />
                    </View>
                  </View>

                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Horário *</Text>
                    <View style={styles.inputBox}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="HH:MM"
                        placeholderTextColor="#5D6B63"
                        value={horarioInput}
                        onChangeText={handleHorarioChangeText}
                        keyboardType="number-pad"
                        maxLength={5}
                      />
                    </View>
                  </View>
                </View>
              </ScrollView>

              <TouchableOpacity
                style={[styles.saveButton, isSubmitting && { opacity: 0.7 }, { marginTop: 16 }]}
                activeOpacity={0.85}
                onPress={handleSalvarAgendamento}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Salvar compromisso</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Modal Mês/Ano */}
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
                <TouchableOpacity
                  onPress={() => setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                  style={styles.navArrow}
                >
                  <Feather name="chevron-left" size={20} color="#1E1E1E" />
                </TouchableOpacity>
                <Text style={styles.modalYearText}>{currentDate.getFullYear()}</Text>
                <TouchableOpacity
                  onPress={() => setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                  style={styles.navArrow}
                >
                  <Feather name="chevron-right" size={20} color="#1E1E1E" />
                </TouchableOpacity>
              </View>

              <View style={styles.monthsGrid}>
                {MESES.map((m, idx) => {
                  const isCurMonth = currentDate.getMonth() === idx;
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[styles.monthOption, isCurMonth && styles.monthOptionActive]}
                      onPress={() => {
                        setCurrentDate(new Date(currentDate.getFullYear(), idx, 1));
                        setIsMonthPickerVisible(false);
                      }}
                    >
                      <Text style={[styles.monthOptionText, isCurMonth && styles.monthOptionTextActive]}>
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

export default AgendaScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 120 },
  header: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#1E1E1E', lineHeight: 32 },
  subtitle: { fontSize: 14, fontWeight: '500', color: '#5D6B63', lineHeight: 24, marginTop: 4 },

  saveButton: {
    height: 50,
    backgroundColor: '#3FA66B',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  saveButtonText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', lineHeight: 20 },

  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    height: 40,
  },
  monthSelectorFull: { width: '100%' },
  monthSelectorWithToday: { flex: 1, marginRight: 14 },
  monthSelector: {
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  monthSelectorText: { fontSize: 14, fontWeight: '700', color: '#1E1E1E' },
  todayButton: {
    width: 76,
    height: 40,
    backgroundColor: '#C9E2D1',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayIcon: { marginRight: 6 },
  todayButtonText: { fontSize: 14, fontWeight: '700', color: '#77B28C' },

  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 12 },
      android: { elevation: 1.5 },
    }),
  },
  weekdaysRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, width: '100%' },
  weekdayCell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  weekdayText: { fontSize: 11.8, fontWeight: '700', color: '#77B28C' },
  daysGrid: { width: '100%' },
  weekRow: { flexDirection: 'row', alignItems: 'stretch', width: '100%' },
  dayCell: { flex: 1, height: 47, alignItems: 'center', justifyContent: 'center' },
  cellBorderRight: { borderRightWidth: 1, borderRightColor: '#E8ECEB' },
  cellBorderBottom: { borderBottomWidth: 1, borderBottomColor: '#E8ECEB' },
  dayNumberText: { fontSize: 12, fontWeight: '700', color: '#1E1E1E' },
  otherMonthDayText: { color: '#B8C0BC' },
  selectedDayBadge: {
    width: 38,
    height: 38,
    backgroundColor: '#C9E2D1',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDayText: { fontSize: 12, fontWeight: '700', color: '#77B28C' },

  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 18,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.03, shadowRadius: 8 },
      android: { elevation: 1.5 },
    }),
  },
  detailsDateTitle: { fontSize: 14, fontWeight: '600', color: '#000000', marginBottom: 12 },
  emptyDetailsContainer: { paddingVertical: 20, alignItems: 'center' },
  emptyDetailsText: { fontSize: 12, color: '#5D6B63' },
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
  verticalGreenBar: { width: 3, height: 20, backgroundColor: '#77B28C', borderRadius: 1.5, marginRight: 6 },
  timeText: { fontSize: 12, fontWeight: '700', color: '#77B28C' },
  medInfoColumn: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingLeft: 12 },
  pillIconBox: {
    width: 25,
    height: 25,
    backgroundColor: '#C9E2D1',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  medTextWrapper: { flex: 1 },
  medNameText: { fontSize: 12, fontWeight: '700', color: '#1E1E1E' },
  medFormaText: { fontSize: 8, fontWeight: '400', color: '#5D6B63', marginTop: 1 },
  moreButton: { padding: 6 },

  bottomBarContainer: { position: 'absolute', bottom: 12, left: 20, right: 20 },
  bottomBar: {
    height: 70,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16 },
      android: { elevation: 4 },
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
  tabItem: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitleText: { fontSize: 18, fontWeight: '700', color: '#1E1E1E' },

  typeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  typeSelectorButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8ECEB',
    backgroundColor: '#F9FAFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeSelectorButtonActive: {
    borderColor: '#3FA66B',
    backgroundColor: '#E8F5EE',
  },
  typeSelectorText: { fontSize: 13, fontWeight: '600', color: '#5D6B63' },
  typeSelectorTextActive: { color: '#3FA66B', fontWeight: '700' },

  fieldGroup: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#1E1E1E', marginBottom: 6 },
  inputBox: {
    height: 46,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.8,
    borderColor: '#E8ECEB',
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  textInput: { fontSize: 13, color: '#1E1E1E' },

  modalContent: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  navArrow: { padding: 8 },
  modalYearText: { fontSize: 18, fontWeight: '700', color: '#1E1E1E' },
  monthsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  monthOption: {
    width: '30%',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#F3F4F6',
  },
  monthOptionActive: { backgroundColor: '#C9E2D1' },
  monthOptionText: { fontSize: 14, fontWeight: '600', color: '#1E1E1E' },
  monthOptionTextActive: { color: '#77B28C', fontWeight: '700' },
});