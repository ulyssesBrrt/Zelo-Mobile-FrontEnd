export type NotificationType = 'geral' | 'estoque_baixo' | 'lembrete' | 'consulta' | 'exame';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  titulo: string;
  descricao: string;
  dataHorario: string;
  lida: boolean;
  createdAt?: number;
}