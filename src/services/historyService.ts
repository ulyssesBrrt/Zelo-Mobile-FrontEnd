import { DoseRecord, DayDoseSummary, PeriodDoseSummary, DoseStatus } from '../types/history';
import { medicationService } from './medicationService';

const DIAS_ABREV = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

class HistoryService {
  private records: DoseRecord[] = [];
  private listeners: (() => void)[] = [];
  private initialized: boolean = false;

  constructor() {
    this.initDefaultRecords();
  }

  private initDefaultRecords() {
    if (this.initialized) return;
    this.initialized = true;

    const today = new Date();
    const formatDate = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const todayStr = formatDate(today);

    // Registros de Hoje correspondentes ao Figma (1 tomado, 2 pendentes, 1 não tomado como exemplo dinâmico)
    this.records = [
      {
        id: 'rec_today_01',
        medicationId: 'med_002',
        nome: 'Dipirona',
        quantidade: '1 comprimido',
        horario: '08:00',
        data: todayStr,
        status: 'tomado',
      },
      {
        id: 'rec_today_02',
        medicationId: 'med_002',
        nome: 'Dipirona',
        quantidade: '1 comprimido',
        horario: '12:00',
        data: todayStr,
        status: 'pendente',
      },
      {
        id: 'rec_today_03',
        medicationId: 'med_002',
        nome: 'Dipirona',
        quantidade: '1 comprimido',
        horario: '18:00',
        data: todayStr,
        status: 'pendente',
      },
      {
        id: 'rec_today_04',
        medicationId: 'med_002',
        nome: 'Dipirona',
        quantidade: '1 comprimido',
        horario: '22:00',
        data: todayStr,
        status: 'nao_tomado',
      },
    ];

    // Popula dias anteriores da semana/mês dinamicamente para alimentar o filtro Semana e Mês
    for (let i = 1; i <= 28; i++) {
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - i);
      const dateStr = formatDate(pastDate);

      // Gera de 2 a 4 doses distribuídas
      const tomadosCount = (i % 3) + 1; // 1, 2 ou 3 tomados
      const pendentesCount = i % 2 === 0 ? 1 : 0; // 0 ou 1 pendente

      for (let t = 0; t < tomadosCount; t++) {
        this.records.push({
          id: `rec_${dateStr}_t_${t}`,
          medicationId: 'med_001',
          nome: t === 0 ? 'Fluoxetina' : 'Dipirona',
          quantidade: t === 0 ? '1 cápsula' : '1 comprimido',
          horario: t === 0 ? '08:00' : '14:00',
          data: dateStr,
          status: 'tomado',
        });
      }

      for (let p = 0; p < pendentesCount; p++) {
        this.records.push({
          id: `rec_${dateStr}_p_${p}`,
          medicationId: 'med_003',
          nome: 'Losartana Potássica',
          quantidade: '1 comprimido',
          horario: '20:00',
          data: dateStr,
          status: 'pendente',
        });
      }
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (err) {
        console.error('Error notifying history listener', err);
      }
    });
  }

  /**
   * Registra uma nova dose tomada (ex: chamada de ConfirmarDose)
   */
  async registerDose(medicationId: string, nome: string, quantidade: string, horario: string): Promise<void> {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    this.records.unshift({
      id: `rec_${Date.now()}`,
      medicationId,
      nome,
      quantidade,
      horario,
      data: dateStr,
      status: 'tomado',
    });

    this.notify();
  }

  /**
   * Obtém os registros do dia selecionado (ex: Hoje)
   */
  async getDayRecords(date: Date): Promise<{ records: DoseRecord[]; summary: PeriodDoseSummary }> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const dayRecords = this.records.filter((r) => r.data === dateStr);

    let totalTomadas = 0;
    let totalPendentes = 0;
    let totalNaoTomadas = 0;

    dayRecords.forEach((r) => {
      if (r.status === 'tomado') totalTomadas++;
      else if (r.status === 'pendente') totalPendentes++;
      else if (r.status === 'nao_tomado') totalNaoTomadas++;
    });

    // Ordena os registros por horário
    dayRecords.sort((a, b) => a.horario.localeCompare(b.horario));

    return {
      records: dayRecords,
      summary: {
        totalTomadas,
        totalPendentes,
        totalNaoTomadas,
      },
    };
  }

  /**
   * Obtém o resumo dos 7 dias da semana a partir de uma data de referência
   */
  async getWeekSummary(startDate: Date): Promise<{ days: DayDoseSummary[]; summary: PeriodDoseSummary }> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const days: DayDoseSummary[] = [];
    let totalTomadas = 0;
    let totalPendentes = 0;
    let totalNaoTomadas = 0;

    for (let i = 0; i < 7; i++) {
      const curDate = new Date(startDate);
      curDate.setDate(startDate.getDate() + i);

      const dateStr = `${curDate.getFullYear()}-${String(curDate.getMonth() + 1).padStart(2, '0')}-${String(curDate.getDate()).padStart(2, '0')}`;
      const dayRecs = this.records.filter((r) => r.data === dateStr);

      let tomados = 0;
      let pendentes = 0;
      let naoTomados = 0;

      dayRecs.forEach((r) => {
        if (r.status === 'tomado') tomados++;
        else if (r.status === 'pendente') pendentes++;
        else if (r.status === 'nao_tomado') naoTomados++;
      });

      totalTomadas += tomados;
      totalPendentes += pendentes;
      totalNaoTomadas += naoTomados;

      days.push({
        data: dateStr,
        diaSemanaLabel: DIAS_ABREV[curDate.getDay()],
        diaMes: curDate.getDate(),
        tomados,
        pendentes,
        naoTomados,
        records: dayRecs,
      });
    }

    return {
      days,
      summary: {
        totalTomadas,
        totalPendentes,
        totalNaoTomadas,
      },
    };
  }

  /**
   * Obtém o resumo consolidado de um mês
   */
  async getMonthSummary(year: number, monthIndex: number): Promise<{ days: DayDoseSummary[]; summary: PeriodDoseSummary }> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const days: DayDoseSummary[] = [];
    let totalTomadas = 0;
    let totalPendentes = 0;
    let totalNaoTomadas = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(year, monthIndex, d);
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayRecs = this.records.filter((r) => r.data === dateStr);

      let tomados = 0;
      let pendentes = 0;
      let naoTomados = 0;

      dayRecs.forEach((r) => {
        if (r.status === 'tomado') tomados++;
        else if (r.status === 'pendente') pendentes++;
        else if (r.status === 'nao_tomado') naoTomados++;
      });

      totalTomadas += tomados;
      totalPendentes += pendentes;
      totalNaoTomadas += naoTomados;

      days.push({
        data: dateStr,
        diaSemanaLabel: DIAS_ABREV[curDate.getDay()],
        diaMes: d,
        tomados,
        pendentes,
        naoTomados,
        records: dayRecs,
      });
    }

    return {
      days,
      summary: {
        totalTomadas,
        totalPendentes,
        totalNaoTomadas,
      },
    };
  }
}

export const historyService = new HistoryService();
