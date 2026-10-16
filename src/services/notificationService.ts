import { NotificationItem } from '../types/notification';
import { medicationService } from './medicationService';

class NotificationService {
  private notifications: NotificationItem[] = [];
  private listeners: (() => void)[] = [];
  private initialized: boolean = false;

  constructor() {
    this.initDefaultNotifications();
  }

  private initDefaultNotifications() {
    if (this.initialized) return;
    this.initialized = true;

    // Inicializa com as notificações consistentes com a rotina de saúde do usuário (respeitando o Figma)
    this.notifications = [
      {
        id: 'notif_01',
        type: 'estoque_baixo',
        titulo: 'Estoque baixo',
        descricao: 'Restam 5 comprimidos de Flouxetina',
        dataHorario: 'Ontem, 10:00',
        lida: false,
        createdAt: Date.now() - 24 * 3600 * 1000,
      },
      {
        id: 'notif_02',
        type: 'hora_medicacao',
        titulo: 'Hora da medicação',
        descricao: '18:00 • Fluoxetina',
        dataHorario: 'Hoje, 18 de ago',
        lida: false,
        createdAt: Date.now() - 3600 * 1000,
      },
      {
        id: 'notif_03',
        type: 'consulta',
        titulo: 'Consulta',
        descricao: '13:40 • Clinica Geral',
        dataHorario: 'Amanhã, 19 de ago',
        lida: false,
        createdAt: Date.now(),
      },
    ];
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
        console.error('Error in notification listener', err);
      }
    });
  }

  /**
   * Obtém a lista dinâmica de notificações ordenada das mais recentes para as mais antigas.
   * Integra também dados reais de medicamentos (ex.: se houver medicamento com estoque <= 5).
   */
  async getNotifications(): Promise<NotificationItem[]> {
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Sincroniza com medicamentos reais cadastrados para estoque baixo
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
              type: 'estoque_baixo',
              titulo: 'Estoque baixo',
              descricao: `Restam ${med.estoque} ${med.estoqueUnidade} de ${med.nome}`,
              dataHorario: 'Hoje, ' + (med.proximoHorario || '10:00'),
              lida: false,
              createdAt: Date.now(),
            });
          }
        }
      });
    } catch {
      // continua com as notificações existentes
    }

    // Ordena preservando notificações não lidas e ordem temporal
    return [...this.notifications];
  }

  /**
   * Marca uma notificação individual como lida.
   */
  async markAsRead(notificationId: string): Promise<void> {
    this.notifications = this.notifications.map((n) =>
      n.id === notificationId ? { ...n, lida: true } : n
    );
    this.notify();
  }

  /**
   * Marca todas as notificações como lidas.
   */
  async markAllAsRead(): Promise<void> {
    this.notifications = this.notifications.map((n) => ({ ...n, lida: true }));
    this.notify();
  }

  /**
   * Verifica se há notificações não lidas.
   */
  hasUnread(): boolean {
    return this.notifications.some((n) => !n.lida);
  }
}

export const notificationService = new NotificationService();
