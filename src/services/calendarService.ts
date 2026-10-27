import { api } from './api';
import { sessionStore } from './sessionStore';

export interface ApiEventoCalendario {
    id: number;
    titulo: string;
    descricao?: string;
    dataHora: string;
    tipo?: string;
    local?: string;
}

export interface CreateEventoDTO {
    titulo: string;
    descricao?: string;
    dataHora: string;
    tipo?: string;
    local?: string;
}

const getUserId = async (): Promise<number> => {
    const user = await sessionStore.restore();
    if (!user || !user.id) {
        throw new Error('Utilizador não autenticado na sessão.');
    }
    return Number(user.id);
};

class CalendarService {
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
                console.error('Error notifying calendar listener', err);
            }
        });
    }

    async getEvents(): Promise<ApiEventoCalendario[]> {
        try {
            const userId = await getUserId();
            return await api.get<ApiEventoCalendario[]>(`/api/usuarios/${userId}/eventos`);
        } catch (error) {
            console.error('Erro ao buscar eventos do calendário:', error);
            return [];
        }
    }

    async getEventsByPeriod(inicio: Date, fim: Date): Promise<ApiEventoCalendario[]> {
        try {
            const userId = await getUserId();
            const inicioIso = inicio.toISOString();
            const fimIso = fim.toISOString();

            return await api.get<ApiEventoCalendario[]>(
                `/api/usuarios/${userId}/eventos/periodo?inicio=${encodeURIComponent(inicioIso)}&fim=${encodeURIComponent(fimIso)}`
            );
        } catch (error) {
            console.error('Erro ao buscar eventos por período:', error);
            return [];
        }
    }

    async addEvent(dto: CreateEventoDTO): Promise<{ success: boolean; event?: ApiEventoCalendario; message?: string }> {
        try {
            const userId = await getUserId();

            const newEvent = await api.post<ApiEventoCalendario>(`/api/usuarios/${userId}/eventos`, dto);
            this.notify();

            return {
                success: true,
                event: newEvent,
            };
        } catch (error: any) {
            console.error('Erro ao cadastrar evento no calendário:', error);
            return { success: false, message: error.message || 'Erro ao agendar evento.' };
        }
    }

    async deleteEvent(eventId: number | string): Promise<{ success: boolean; message?: string }> {
        try {
            const userId = await getUserId();

            await api.delete(`/api/usuarios/${userId}/eventos/${eventId}`);
            this.notify();

            return { success: true, message: 'Evento removido com sucesso.' };
        } catch (error: any) {
            console.error('Erro ao deletar evento:', error);
            return { success: false, message: error.message || 'Erro ao remover evento.' };
        }
    }
}

export const calendarService = new CalendarService();