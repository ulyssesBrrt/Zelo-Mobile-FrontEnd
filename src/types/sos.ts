export interface EmergencyContact {
  id?: string;
  nome: string;
  telefone: string;
  parentesco?: string;
  principal?: boolean;
}

export interface EmergencyState {
  contatoPrincipal: EmergencyContact;
  samuNumero: string;
}