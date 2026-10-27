import { api } from './api';
import { sessionStore } from './sessionStore';
import { ApiMedicamento } from '../types/api';
import { HomeData, ConfirmedDoseData } from '../types/home';
import { MedicationItem, MedicationStatus, CreateMedicationDTO, MedicationType } from '../types/medication';
import { historyService } from './historyService';

// ----- Funções Auxiliares de Data e Sessão -----

const getUserId = async (): Promise<number> => {
  const user = await sessionStore.restore();
  if (!user || !user.id) {
    throw new Error('Utilizador não autenticado na sessão.');
  }
  return Number(user.id);
};

const getUserFirstName = async (): Promise<string> => {
  try {
    const user = await sessionStore.restore();
    if (user && user.nome) {
      return user.nome.split(' ')[0];
    }
  } catch (e) {
    console.error('Erro ao buscar nome na sessão:', e);
  }
  return '';
};

const parseTimeToTodayDate = (timeStr: string): Date => {
  const clean = timeStr.trim().replace('h', ':');
  const parts = clean.split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const mapToMedicationItem = (apiMed: ApiMedicamento): MedicationItem => {
  let tipo: MedicationType = 'comprimido';
  const formatoLower = (apiMed.formato || '').toLowerCase();
  if (formatoLower.includes('gota')) tipo = 'gotas';
  if (formatoLower.includes('capsula') || formatoLower.includes('cápsula')) tipo = 'capsula';

  const proximoHorario = (apiMed.alarmes && apiMed.alarmes.length > 0)
    ? apiMed.alarmes[0].hora
    : 'Sem horário';

  const status: MedicationStatus = apiMed.ativo ? 'ativo' : 'inativo';

  return {
    id: String(apiMed.id),
    nome: apiMed.nome,
    dosagem: apiMed.dosagem,
    forma: apiMed.formato,
    tipo,
    viaAdministracao: apiMed.viaAdministracao || '',
    proximoHorario,
    estoque: apiMed.quantidadeEstoque,
    estoqueUnidade: 'unidades',
    status,
  };
};

class MedicationService {

  private listeners: (() => void)[] = [];

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Error notifying medication listener', err);
      }
    });
  }

  // ----- Chamadas à API -----

  async getMedications(): Promise<MedicationItem[]> {
    try {
      const userId = await getUserId();
      const apiMeds = await api.get<ApiMedicamento[]>(`/api/usuarios/${userId}/medicamentos`);
      return apiMeds.map(mapToMedicationItem);
    } catch (error) {
      console.error('Erro ao buscar medicamentos:', error);
      return [];
    }
  }

  async addMedication(dto: CreateMedicationDTO): Promise<{ success: boolean; medication?: MedicationItem; message?: string }> {
    try {
      const userId = await getUserId();
      const horarioFormatado = dto.horario.trim().replace('h', ':');

      const requestBody = {
        nome: dto.nome.trim(),
        dosagem: dto.dosagem.trim(),
        formato: dto.formato.trim(),
        viaAdministracao: dto.viaAdministracao.trim(),
        horario: horarioFormatado,
        quantidadeEstoque: Number(dto.estoque) || 0
      };

      const apiMed = await api.post<ApiMedicamento>(`/api/usuarios/${userId}/medicamentos/completo`, requestBody);
      this.notify();

      return {
        success: true,
        medication: mapToMedicationItem(apiMed)
      };
    } catch (error: any) {
      console.error('Erro ao adicionar medicamento:', error);
      return { success: false, message: error.message || 'Erro ao adicionar medicamento.' };
    }
  }

  async updateMedicationStatus(medicationId: string, newStatus: MedicationStatus): Promise<{ success: boolean; message: string }> {
    try {
      const userId = await getUserId();
      const isAtivo = newStatus === 'ativo';

      await api.patch(`/api/usuarios/${userId}/medicamentos/${medicationId}/status?ativo=${isAtivo}`);
      this.notify();
      return { success: true, message: `Status atualizado com sucesso.` };
    } catch (error: any) {
      return { success: false, message: error.message || 'Erro ao atualizar status.' };
    }
  }

  async deleteMedication(medicationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const userId = await getUserId();
      await api.delete(`/api/usuarios/${userId}/medicamentos/${medicationId}`);
      this.notify();
      return { success: true, message: 'Medicamento removido com sucesso.' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Erro ao remover medicamento.' };
    }
  }

  // ----- Métodos para Home e Histórico -----

  async getHomeData(): Promise<HomeData> {
    const meds = await this.getMedications();

    let userName = '';
    let fotoUri: string | undefined = undefined;

    try {
      const user = await sessionStore.restore();
      if (user) {
        if (user.nome) {
          userName = user.nome.split(' ')[0];
        }
        if ((user as any).fotoUri) {
          fotoUri = (user as any).fotoUri;
        }
      }
    } catch (e) {
      console.error('Erro ao buscar dados da sessão para a Home:', e);
    }

    const activeMeds = meds.filter((m) => m.status === 'ativo');

    if (activeMeds.length === 0) {
      return {
        userName,
        fotoUri,
        avatarUrl: fotoUri,
        hasUnreadNotifications: false,
        nextMedication: undefined,
      };
    }

    let takenTodayIds = new Set<string>();
    try {
      const todayList = await historyService.getTodayDoses();
      takenTodayIds = new Set(todayList);
    } catch (e) {
      console.error('Erro ao verificar doses tomadas hoje:', e);
    }

    const mappedMeds = activeMeds.map((med) => {
      const targetToday = parseTimeToTodayDate(med.proximoHorario || '00:00');
      let nextTimestamp = targetToday.getTime();

      // Se o horário de hoje já passou ou a dose já foi confirmada hoje, projeta a dose para amanhã
      if (takenTodayIds.has(med.id) || nextTimestamp <= Date.now()) {
        const targetTomorrow = new Date(targetToday);
        targetTomorrow.setDate(targetTomorrow.getDate() + 1);
        nextTimestamp = targetTomorrow.getTime();
      }

      return {
        med,
        nextTimestamp,
      };
    });

    mappedMeds.sort((a, b) => a.nextTimestamp - b.nextTimestamp);

    const nextItem = mappedMeds[0];
    const nextMed = nextItem ? nextItem.med : undefined;
    const proximaDoseTimestamp = nextItem ? nextItem.nextTimestamp : 0;

    return {
      userName,
      fotoUri,
      avatarUrl: fotoUri,
      hasUnreadNotifications: false,
      nextMedication: nextMed
        ? {
          id: nextMed.id,
          nome: `${nextMed.nome} ${nextMed.dosagem}`.trim(),
          horario: nextMed.proximoHorario || '',
          proximaDoseTimestamp,
          dosagem: nextMed.dosagem,
        }
        : undefined,
    };
  }

  async getMedicationsByDate(date: Date): Promise<MedicationItem[]> {
    const meds = await this.getMedications();
    const dayMeds = meds.filter((med) => med.status !== 'inativo');

    return dayMeds.sort((a, b) => {
      const timeA = (a.proximoHorario || '00:00').replace('h', ':');
      const timeB = (b.proximoHorario || '00:00').replace('h', ':');
      return timeA.localeCompare(timeB);
    });
  }

  async confirmDose(medicationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const userId = await getUserId();
      const meds = await this.getMedications();
      const med = meds.find((m) => m.id === medicationId);

      if (med) {
        await api.patch(`/api/usuarios/${userId}/medicamentos/${medicationId}/dar-baixa?quantidade=1`, {});

        await historyService.registerDose(
          med.id,
          med.nome,
          med.forma || '1 dose',
          med.proximoHorario || '00:00'
        );

        this.notify();
        return { success: true, message: 'Dose registrada e estoque atualizado!' };
      }
      return { success: false, message: 'Medicamento não encontrado.' };
    } catch (e) {
      console.error('Erro ao registrar dose:', e);
      return { success: false, message: 'Erro ao registrar dose.' };
    }
  }

  async getConfirmedDoseData(medicationId?: string): Promise<ConfirmedDoseData> {
    const meds = await this.getMedications();
    const med = medicationId ? meds.find((m) => m.id === medicationId) : meds[0];

    return {
      medicamentoNome: med ? med.nome : '',
      quantidade: med ? med.forma : '',
      horarioDose: med ? (med.proximoHorario || '') : '',
      proximaDoseHorario: med ? (med.proximoHorario || '') : '',
      hasUnreadNotifications: false,
    };
  }
}

export const medicationService = new MedicationService();

