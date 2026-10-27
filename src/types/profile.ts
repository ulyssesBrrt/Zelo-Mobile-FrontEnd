export interface HealthInfo {
  dataNascimento?: string;
  tipoSanguineo?: string;
  alergias?: string;
  condicaoSaude?: string;
  observacoesImportantes?: string;
}

export interface UserProfile {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  fotoUri?: string;
  healthInfo: HealthInfo;
}
