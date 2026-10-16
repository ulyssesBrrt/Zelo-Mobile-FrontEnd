export interface EmergencyContact {
  id: string;
  nome: string;
  telefone: string;
  parentesco?: string;
}

export interface EmergencyState {
  contatoPrincipal: EmergencyContact;
  samuNumero: string;
}
