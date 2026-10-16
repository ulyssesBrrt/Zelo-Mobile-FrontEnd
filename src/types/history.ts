export type DoseStatus = 'tomado' | 'pendente' | 'nao_tomado';

export interface DoseRecord {
  id: string;
  medicationId: string;
  nome: string;
  quantidade: string; // Ex: "1 comprimido", "20 gotas"
  horario: string; // Ex: "08:00"
  data: string; // YYYY-MM-DD
  status: DoseStatus;
}

export interface DayDoseSummary {
  data: string; // YYYY-MM-DD
  diaSemanaLabel: string; // Ex: "QUI"
  diaMes: number; // Ex: 13
  tomados: number;
  pendentes: number;
  naoTomados: number;
  records: DoseRecord[];
}

export interface PeriodDoseSummary {
  totalTomadas: number;
  totalPendentes: number;
  totalNaoTomadas: number;
}
