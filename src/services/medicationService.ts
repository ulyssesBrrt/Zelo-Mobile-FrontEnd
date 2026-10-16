import { HomeData, NextMedication, ConfirmedDoseData } from '../types/home';
import { MedicationItem, MedicationStatus, CreateMedicationDTO, MedicationType } from '../types/medication';

class MedicationService {
  private initialStatuses: MedicationStatus[] = ['ativo', 'pausa', 'inativo'];

  private getRandomStatus(forced?: MedicationStatus): MedicationStatus {
    if (forced) return forced;
    const index = Math.floor(Math.random() * this.initialStatuses.length);
    return this.initialStatuses[index];
  }

  // Persistência local em memória dos medicamentos cadastrados
  private medications: MedicationItem[] = [
    {
      id: 'med_001',
      nome: 'Fluoxetina',
      dosagem: '20mg',
      forma: '1 cápsula',
      tipo: 'capsula',
      viaAdministracao: 'Oral',
      proximoHorario: '10:00',
      estoque: 14,
      estoqueUnidade: 'cápsulas',
      status: 'ativo',
    },
    {
      id: 'med_002',
      nome: 'Dipirona',
      dosagem: '500mg',
      forma: '20 gotas',
      tipo: 'gotas',
      viaAdministracao: 'Oral',
      proximoHorario: '14:30',
      estoque: 3,
      estoqueUnidade: 'frascos',
      status: 'pausa',
    },
    {
      id: 'med_003',
      nome: 'Losartana Potássica',
      dosagem: '50mg',
      forma: '1 comprimido',
      tipo: 'comprimido',
      viaAdministracao: 'Oral',
      proximoHorario: '08:00',
      estoque: 28,
      estoqueUnidade: 'comprimidos',
      status: 'inativo',
    },
    {
      id: 'med_004',
      nome: 'Amoxicilina',
      dosagem: '500mg',
      forma: '1 cápsula',
      tipo: 'capsula',
      viaAdministracao: 'Oral',
      proximoHorario: '12:00',
      estoque: 8,
      estoqueUnidade: 'cápsulas',
      status: 'ativo',
    },
    {
      id: 'med_005',
      nome: 'Paracetamol',
      dosagem: '750mg',
      forma: '1 comprimido',
      tipo: 'comprimido',
      viaAdministracao: 'Oral',
      proximoHorario: '19:00',
      estoque: 20,
      estoqueUnidade: 'comprimidos',
      status: 'pausa',
    },
    {
      id: 'med_006',
      nome: 'Omeprazol',
      dosagem: '20mg',
      forma: '1 cápsula',
      tipo: 'capsula',
      viaAdministracao: 'Oral',
      proximoHorario: '07:00',
      estoque: 12,
      estoqueUnidade: 'cápsulas',
      status: 'inativo',
    },
  ];

  private listeners: (() => void)[] = [];

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Error notifying medication listener', err);
      }
    });
  }

  /**
   * Obtém os dados dinâmicos da Tela Principal.
   */
  async getHomeData(): Promise<HomeData> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const proximaDoseTimestamp = Date.now() + (18 * 60 + 32) * 1000;

    return {
      userName: 'Ulysses Barreto',
      hasUnreadNotifications: true,
      nextMedication: {
        id: 'med_001',
        nome: 'Flouxetina 20mg',
        horario: '10:00',
        proximaDoseTimestamp,
      },
    };
  }

  /**
   * Confirma a dose tomada do medicamento.
   */
  async confirmDose(medicationId: string): Promise<{ success: boolean; message: string }> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return {
      success: true,
      message: 'Dose registrada com sucesso!',
    };
  }

  /**
   * Obtém os dados dinâmicos da dose confirmada e da próxima dose programada.
   */
  async getConfirmedDoseData(medicationId?: string): Promise<ConfirmedDoseData> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      medicamentoNome: 'Flouxetina',
      quantidade: '1 comprimido',
      horarioDose: '10:00 h',
      proximaDoseHorario: '18:00h',
      hasUnreadNotifications: true,
    };
  }

  /**
   * Obtém a lista dinâmica de medicamentos cadastrados.
   */
  async getMedications(): Promise<MedicationItem[]> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return [...this.medications];
  }

  /**
   * Cadastra um novo medicamento e notifica observadores para atualização imediata.
   */
  async addMedication(dto: CreateMedicationDTO): Promise<{ success: boolean; medication: MedicationItem }> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Determina o tipo e unidade a partir do formato
    let tipo: MedicationType = 'capsula';
    let estoqueUnidade = 'unidades';

    const formatoLower = dto.formato.toLowerCase();
    if (formatoLower.includes('gota')) {
      tipo = 'gotas';
      estoqueUnidade = 'frascos';
    } else if (formatoLower.includes('comprimido')) {
      tipo = 'comprimido';
      estoqueUnidade = 'comprimidos';
    } else if (formatoLower.includes('cápsula') || formatoLower.includes('capsula')) {
      tipo = 'capsula';
      estoqueUnidade = 'cápsulas';
    }

    const newMedication: MedicationItem = {
      id: `med_${Date.now()}`,
      nome: dto.nome.trim(),
      dosagem: dto.dosagem.trim(),
      forma: dto.formato.trim(),
      tipo,
      viaAdministracao: dto.viaAdministracao.trim(),
      proximoHorario: dto.horario.trim(),
      estoque: Number(dto.estoque),
      estoqueUnidade,
      status: this.getRandomStatus(), // Status dinâmico e aleatório (ativo, pausa ou inativo)
    };

    // Insere no início da lista para aparecer imediatamente
    this.medications = [newMedication, ...this.medications];
    this.notify();

    return {
      success: true,
      medication: newMedication,
    };
  }

  /**
   * Atualiza o status de um medicamento.
   */
  async updateMedicationStatus(
    medicationId: string,
    newStatus: MedicationStatus
  ): Promise<{ success: boolean; message: string }> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    this.medications = this.medications.map((med) =>
      med.id === medicationId ? { ...med, status: newStatus } : med
    );
    this.notify();
    return {
      success: true,
      message: `Status atualizado para ${newStatus}.`,
    };
  }

  /**
   * Obtém os medicamentos programados para uma determinada data.
   * Conforme especificação:
   * - Utiliza os medicamentos reais já cadastrados pelo usuário
   * - Ordena por horário crescente
   * - Filtra por status ativo/pausa
   */
  async getMedicationsByDate(date: Date): Promise<MedicationItem[]> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    // Retorna os medicamentos ativos e em pausa ordenados pelo horário cadastrado
    const dayMeds = this.medications.filter((med) => med.status !== 'inativo');

    return [...dayMeds].sort((a, b) => {
      const timeA = (a.proximoHorario || '00:00').replace('h', ':');
      const timeB = (b.proximoHorario || '00:00').replace('h', ':');
      return timeA.localeCompare(timeB);
    });
  }

  /**
   * Exclui um medicamento cadastrado.
   */
  async deleteMedication(
    medicationId: string
  ): Promise<{ success: boolean; message: string }> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    this.medications = this.medications.filter((med) => med.id !== medicationId);
    this.notify();
    return {
      success: true,
      message: 'Medicamento removido com sucesso.',
    };
  }
}

export const medicationService = new MedicationService();

