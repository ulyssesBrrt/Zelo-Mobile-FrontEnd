export interface HealthInfo {
  dataNascimento: string; // Ex: '05/07/2007'
  tipoSanguineo: string;  // Ex: 'O-'
  alergias: string;       // Ex: 'Abelha, Penicilina'
  condicaoSaude: string;  // Ex: 'Diabético, Hipertensão'
}

export interface UserProfile {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  fotoUri?: string;
  healthInfo: HealthInfo;
}
