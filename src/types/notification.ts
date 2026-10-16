export type NotificationType = 'estoque_baixo' | 'hora_medicacao' | 'consulta';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  titulo: string;
  descricao: string;
  dataHorario: string;
  lida: boolean;
  createdAt: number;
}
