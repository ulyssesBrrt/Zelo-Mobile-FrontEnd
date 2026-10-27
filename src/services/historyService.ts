import { api } from './api';
import { sessionStore } from './sessionStore';
import { DoseRecord, DayDoseSummary, PeriodDoseSummary, DoseStatus } from '../types/history';

const DIAS_ABREV = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

// Interface para os dados recebidos do Spring Boot
interface ApiRegistroDose {
  id: number;
  medicamentoId: number;
  nomeMedicamento: string;
  quantidade: string;
  horario: string;
  dataRegistro: string;
  status: string;
}

class HistoryService {
  private listeners: (() => void)[] = [];

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

  // Recupera o ID do utilizador logado
  private async getUserId(): Promise<number> {
    const user = await sessionStore.restore();
    if (!user || !user.id) {
      throw new Error('Utilizador não autenticado na sessão.');
    }
    return Number(user.id);
  }

  // Busca todos os registos reais do utilizador no MySQL
  private async fetchAllRecords(): Promise<DoseRecord[]> {
    try {
      const userId = await this.getUserId();
      const apiRecords = await api.get<ApiRegistroDose[]>(`/api/usuarios/${userId}/historico`);

      return apiRecords.map(record => ({
        id: String(record.id),
        medicationId: String(record.medicamentoId),
        nome: record.nomeMedicamento,
        quantidade: record.quantidade,
        horario: record.horario,
        data: record.dataRegistro,
        status: record.status as DoseStatus
      }));
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      return [];
    }
  }

  /**
   * Retorna os IDs dos medicamentos cujas doses foram tomadas na data de hoje
   */
  async getTodayDoses(): Promise<string[]> {
    const records = await this.fetchAllRecords();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    return records
      .filter((r) => r.data === todayStr && r.status === 'tomado')
      .map((r) => r.medicationId);
  }

  /**
   * Grava a dose tomada no MySQL através do Controller RegistroDoseController
   */
  async registerDose(medicationId: string, nome: string, quantidade: string, horario: string): Promise<void> {
    try {
      const userId = await this.getUserId();
      const today = new Date();

      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const requestBody = {
        medicamentoId: Number(medicationId),
        nome: nome,
        quantidade: quantidade,
        horario: horario,
        data: dateStr,
        status: 'tomado'
      };

      await api.post(`/api/usuarios/${userId}/historico`, requestBody);
      this.notify();
    } catch (error) {
      console.error('Erro ao registrar dose:', error);
    }
  }

  /**
   * Obtém os registos e filtra pelo dia selecionado
   */
  async getDayRecords(date: Date): Promise<{ records: DoseRecord[]; summary: PeriodDoseSummary }> {
    const records = await this.fetchAllRecords();
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const dayRecords = records.filter((r) => r.data === dateStr);

    let totalTomadas = 0;
    let totalPendentes = 0;
    let totalNaoTomadas = 0;

    dayRecords.forEach((r) => {
      if (r.status === 'tomado') totalTomadas++;
      else if (r.status === 'pendente') totalPendentes++;
      else if (r.status === 'nao_tomado') totalNaoTomadas++;
    });

    dayRecords.sort((a, b) => a.horario.localeCompare(b.horario));

    return {
      records: dayRecords,
      summary: { totalTomadas, totalPendentes, totalNaoTomadas },
    };
  }

  /**
   * Constrói o calendário semanal com base nos dados do MySQL
   */
  async getWeekSummary(startDate: Date): Promise<{ days: DayDoseSummary[]; summary: PeriodDoseSummary }> {
    const records = await this.fetchAllRecords();
    const days: DayDoseSummary[] = [];

    let totalTomadas = 0;
    let totalPendentes = 0;
    let totalNaoTomadas = 0;

    for (let i = 0; i < 7; i++) {
      const curDate = new Date(startDate);
      curDate.setDate(startDate.getDate() + i);

      const dateStr = `${curDate.getFullYear()}-${String(curDate.getMonth() + 1).padStart(2, '0')}-${String(curDate.getDate()).padStart(2, '0')}`;
      const dayRecs = records.filter((r) => r.data === dateStr);

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
      summary: { totalTomadas, totalPendentes, totalNaoTomadas },
    };
  }

  /**
   * Constrói o calendário mensal com base nos dados do MySQL
   */
  async getMonthSummary(year: number, monthIndex: number): Promise<{ days: DayDoseSummary[]; summary: PeriodDoseSummary }> {
    const records = await this.fetchAllRecords();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const days: DayDoseSummary[] = [];

    let totalTomadas = 0;
    let totalPendentes = 0;
    let totalNaoTomadas = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(year, monthIndex, d);
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayRecs = records.filter((r) => r.data === dateStr);

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
      summary: { totalTomadas, totalPendentes, totalNaoTomadas },
    };
  }
}

export const historyService = new HistoryService();