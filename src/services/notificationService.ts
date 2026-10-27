import { api } from './api';
import { sessionStore } from './sessionStore';
import { NotificationItem, NotificationType } from '../types/notification';
import { medicationService } from './medicationService';
import { agendaService } from './agendaService';

interface ApiNotificacao {
  id: number;
  titulo: string;
  descricao: string;
  dataHorario?: string;
  tipo?: string;
  lida: boolean;
}

class NotificationService {
  private notifications: NotificationItem[] = [];
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
        console.error('Error in notification listener:', err);
      }
    });
  }

  private async getUserId(): Promise<number> {
    try {
      const user = await sessionStore.restore();
      return user?.id ? Number(user.id) : 1;
    } catch {
      return 1;
    }
  }

  async getNotifications(): Promise<NotificationItem[]> {
    try {
      const userId = await this.getUserId();
      const apiNotifs = await api.get<ApiNotificacao[]>(`/api/usuarios/${userId}/notificacoes`);

      const remoteNotifs: NotificationItem[] = (apiNotifs || []).map((n) => ({
        id: String(n.id),
        titulo: n.titulo,
        descricao: n.descricao || '',
        dataHorario: n.dataHorario || 'Hoje',
        type: (n.tipo as NotificationType) || 'geral',
        lida: n.lida,
        createdAt: Date.now(),
      }));

      this.notifications = remoteNotifs;

      // 1. Avisos de estoque baixo
      try {
        const meds = await medicationService.getMedications();
        meds.forEach((med) => {
          if (med.estoque <= 8 && med.estoque > 0) {
            const exists = this.notifications.some(
              (n) => n.type === 'estoque_baixo' && n.descricao.includes(med.nome)
            );
            if (!exists) {
              this.notifications.unshift({
                id: `notif_stock_${med.id}`,
                type: 'estoque_baixo' as NotificationType,
                titulo: 'Estoque baixo',
                descricao: `Restam ${med.estoque} ${med.estoqueUnidade || 'unidades'} de ${med.nome}`,
                dataHorario: 'Hoje, ' + (med.proximoHorario || '10:00'),
                lida: false,
                createdAt: Date.now(),
              });
            }
          }
        });
      } catch (err) {
        console.error('Erro ao verificar estoque de medicamentos:', err);
      }

      // 2. Lembretes de Consultas e Exames salvos no Spring Boot
      try {
        const agendamentos = await agendaService.getAgendamentos();
        agendamentos.forEach((ag) => {
          const title = ag.tipo === 'CONSULTA' ? 'Lembrete de Consulta' : 'Lembrete de Exame';
          const name = ag.tipo === 'CONSULTA' ? ag.nomeClinica : ag.laboratorio;
          const notifId = `notif_agendamento_${ag.id}`;

          const exists = this.notifications.some((n) => n.id === notifId);
          if (!exists && name) {
            this.notifications.unshift({
              id: notifId,
              type: (ag.tipo === 'CONSULTA' ? 'consulta' : 'exame') as NotificationType,
              titulo: title,
              descricao: `${ag.tipo === 'CONSULTA' ? 'Consulta em' : 'Exame no'} ${name} às ${ag.dataHorario ? ag.dataHorario.substring(11, 16) : '09:00'
                }`,
              dataHorario: ag.dataHorario ? ag.dataHorario.replace('T', ' às ') : 'Agendado',
              lida: false,
              createdAt: Date.now(),
            });
          }
        });
      } catch (err) {
        console.error('Erro ao verificar agendamentos para notificações:', err);
      }

      return [...this.notifications];
    } catch (error) {
      console.error('Erro ao buscar notificações do banco:', error);
      return [...this.notifications];
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      this.notifications = this.notifications.map((n) =>
        n.id === notificationId ? { ...n, lida: true } : n
      );
      this.notify();

      if (!notificationId.startsWith('notif_stock_') && !notificationId.startsWith('notif_agendamento_')) {
        const userId = await this.getUserId();
        await api.patch(`/api/usuarios/${userId}/notificacoes/${notificationId}/lida`, {});
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      this.notifications = this.notifications.map((n) => ({ ...n, lida: true }));
      this.notify();

      const userId = await this.getUserId();
      await api.patch(`/api/usuarios/${userId}/notificacoes/ler-todas`, {});
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
    }
  }

  hasUnread(): boolean {
    return this.notifications.some((n) => !n.lida);
  }
}

export const notificationService = new NotificationService();