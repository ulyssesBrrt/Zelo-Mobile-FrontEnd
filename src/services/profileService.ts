import { UserProfile, HealthInfo } from '../types/profile';

type Listener = (profile: UserProfile) => void;

class ProfileService {
  private profile: UserProfile = {
    id: 'usr_001',
    nome: 'Ulysses Sousa Barreto',
    email: 'ulyssesbarreto2017@gmail.com',
    telefone: '(74) 99933-5185',
    fotoUri: undefined, // Se indefinido, utiliza o asset padrão de avatar do projeto
    healthInfo: {
      dataNascimento: '05/07/2007',
      tipoSanguineo: 'O-',
      alergias: 'Abelha, Penicilina',
      condicaoSaude: 'Diabético, Hipertensão',
    },
  };

  private listeners: Listener[] = [];

  subscribe(listener: Listener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener({ ...this.profile }));
  }

  async getProfile(): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return { ...this.profile };
  }

  async updatePersonalData(data: Partial<Pick<UserProfile, 'nome' | 'email' | 'telefone'>>): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    this.profile = {
      ...this.profile,
      ...data,
    };
    this.notify();
    return { ...this.profile };
  }

  async updateHealthInfo(healthInfo: Partial<HealthInfo>): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    this.profile = {
      ...this.profile,
      healthInfo: {
        ...this.profile.healthInfo,
        ...healthInfo,
      },
    };
    this.notify();
    return { ...this.profile };
  }

  async updatePhoto(fotoUri: string | undefined): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    this.profile = {
      ...this.profile,
      fotoUri,
    };
    this.notify();
    return { ...this.profile };
  }
}

export const profileService = new ProfileService();
