export interface NextMedication {
  id: string;
  nome: string;
  horario: string;
  proximaDoseTimestamp: number;
  dosagem?: string;
}

export interface HomeData {
  userName: string;
  avatarUrl?: string;
  hasUnreadNotifications: boolean;
  nextMedication: NextMedication;
}

export interface ConfirmedDoseData {
  medicamentoNome: string;
  quantidade: string;
  horarioDose: string;
  proximaDoseHorario: string;
  hasUnreadNotifications: boolean;
}

