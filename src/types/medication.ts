export type MedicationStatus = 'ativo' | 'pausa' | 'inativo';

export type MedicationType = 'capsula' | 'gotas' | 'comprimido';

export type MedicationFormato = 'Cápsula' | 'Comprimido' | 'Gotas' | 'Líquido' | 'Pomada' | 'Injetável';

export type MedicationVia = 'Oral' | 'Sublingual' | 'Tópica' | 'Inalatória' | 'Oftálmica' | 'Injetável';

export interface MedicationItem {
  id: string;
  nome: string;
  dosagem: string;
  forma: string;
  tipo: MedicationType;
  viaAdministracao?: string;
  proximoHorario: string;
  estoque: number;
  estoqueUnidade: string;
  status: MedicationStatus;
}

export interface CreateMedicationDTO {
  nome: string;
  dosagem: string;
  formato: string;
  viaAdministracao: string;
  horario: string;
  estoque: number;
}
