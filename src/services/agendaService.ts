import { api } from './api';
import { sessionStore } from './sessionStore';

export interface AgendamentoPayload {
    tipo: 'CONSULTA' | 'EXAME';
    nomeClinica?: string;
    medico?: string;
    especialidade?: string;
    laboratorio?: string;
    tipoExame?: string;
    medicoSolicitante?: string;
    dataHorario: string; // Formato LocalDateTime: YYYY-MM-DDTHH:mm:ss
}

export interface AgendamentoItem extends AgendamentoPayload {
    id: number;
    usuarioId: number;
}

class AgendaService {
    private async getUserId(): Promise<number> {
        const user = await sessionStore.restore();
        return user?.id ? Number(user.id) : 1;
    }

    async getAgendamentos(): Promise<AgendamentoItem[]> {
        try {
            const userId = await this.getUserId();
            return await api.get<AgendamentoItem[]>(`/api/agendamentos/usuario/${userId}`);
        } catch (error) {
            console.error('Erro ao buscar agendamentos:', error);
            return [];
        }
    }

    async createAgendamento(payload: Omit<AgendamentoPayload, 'usuarioId'>): Promise<AgendamentoItem> {
        const userId = await this.getUserId();
        return await api.post<AgendamentoItem>('/api/agendamentos', {
            ...payload,
            usuarioId: userId,
        });
    }
}

export const agendaService = new AgendaService();