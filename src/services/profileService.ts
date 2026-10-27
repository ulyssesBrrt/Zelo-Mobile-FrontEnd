import { API_URL } from '../config/env';
import { api } from './api';
import { sessionStore } from './sessionStore';
import { UserProfile, HealthInfo } from '../types/profile';
import { medicationService } from './medicationService';

interface ApiUsuarioProfile {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  fotoUrl?: string;
  fotoUri?: string;
  dataNascimento?: any;
  tipoSanguineo?: string;
  alergias?: string;
  condicaoSaude?: string;
  observacoesImportantes?: string;
}

class ProfileService {
  private listeners: ((profile: UserProfile) => void)[] = [];

  subscribe(listener: (profile: UserProfile) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(profile: UserProfile) {
    this.listeners.forEach((listener) => {
      try {
        listener(profile);
      } catch (err) {
        console.error('Error notifying profile listener', err);
      }
    });
  }

  private async getUserId(): Promise<number> {
    const user = await sessionStore.restore();
    if (!user || !user.id) {
      throw new Error('Utilizador não autenticado na sessão.');
    }
    return Number(user.id);
  }

  private formatarDataExibicao(dataRaw: any): string {
    if (!dataRaw) return '';

    if (Array.isArray(dataRaw) && dataRaw.length >= 3) {
      const [ano, mes, dia] = dataRaw;
      const d = String(dia).padStart(2, '0');
      const m = String(mes).padStart(2, '0');
      return `${d}/${m}/${ano}`;
    }

    if (typeof dataRaw === 'string' && dataRaw.includes('-')) {
      const parts = dataRaw.split('T')[0].split('-');
      if (parts.length === 3) {
        const [ano, mes, dia] = parts;
        return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
      }
    }

    return String(dataRaw);
  }

  private mapToUserProfile(apiUser: ApiUsuarioProfile, localFotoUri?: string): UserProfile {
    const dataFormatada = this.formatarDataExibicao(apiUser.dataNascimento);

    // Prioriza a foto local para garantir exibição imediata no React Native
    let finalFotoUri = localFotoUri || apiUser.fotoUrl || apiUser.fotoUri;

    if (finalFotoUri && !finalFotoUri.startsWith('http') && !finalFotoUri.startsWith('file') && !finalFotoUri.startsWith('content') && !finalFotoUri.startsWith('ph')) {
      const cleanPath = finalFotoUri.startsWith('/') ? finalFotoUri : `/${finalFotoUri}`;
      finalFotoUri = `${API_URL}${cleanPath}`;
    }

    return {
      id: String(apiUser.id),
      nome: apiUser.nome || '',
      email: apiUser.email || '',
      telefone: apiUser.telefone || '',
      fotoUri: finalFotoUri,
      dataNascimento: dataFormatada,
      healthInfo: {
        dataNascimento: dataFormatada,
        tipoSanguineo: apiUser.tipoSanguineo || '',
        alergias: apiUser.alergias || '',
        condicaoSaude: apiUser.condicaoSaude || '',
        observacoesImportantes: apiUser.observacoesImportantes || '',
      },
    } as UserProfile;
  }

  async getProfile(): Promise<UserProfile> {
    try {
      const userId = await this.getUserId();
      const apiUser = await api.get<ApiUsuarioProfile>(`/api/usuarios/${userId}`);
      const user = await sessionStore.restore();
      // Se houver uma foto salva na sessão local, utiliza ela
      return this.mapToUserProfile(apiUser, (user as any)?.fotoUri);
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      const user = await sessionStore.restore();
      return {
        id: user?.id ? String(user.id) : '',
        nome: user?.nome || '',
        email: user?.email || '',
        telefone: (user as any)?.telefone || '',
        fotoUri: (user as any)?.fotoUri || undefined,
        dataNascimento: '',
        healthInfo: {
          dataNascimento: '',
          tipoSanguineo: '',
          alergias: '',
          condicaoSaude: '',
          observacoesImportantes: '',
        },
      } as UserProfile;
    }
  }

  async updatePersonalData(
    data: Partial<Pick<UserProfile, 'nome' | 'email' | 'telefone'>> & { dataNascimento?: string }
  ): Promise<UserProfile> {
    try {
      const userId = await this.getUserId();

      const payload: Record<string, any> = {};
      if (data.nome !== undefined) payload.nome = data.nome;
      if (data.email !== undefined) payload.email = data.email;
      if (data.telefone !== undefined) payload.telefone = data.telefone;
      if (data.dataNascimento !== undefined) payload.dataNascimento = data.dataNascimento;

      const apiUser = await api.put<ApiUsuarioProfile>(`/api/usuarios/${userId}`, payload);
      const updated = this.mapToUserProfile(apiUser);
      this.notify(updated);
      return updated;
    } catch (error) {
      console.error('Erro ao atualizar dados pessoais:', error);
      throw error;
    }
  }

  async updateHealthInfo(healthInfo: Partial<HealthInfo>): Promise<UserProfile> {
    try {
      const userId = await this.getUserId();

      const payloadSaude = {
        tipoSanguineo: healthInfo.tipoSanguineo || '',
        alergias: healthInfo.alergias || '',
        condicaoSaude: healthInfo.condicaoSaude || '',
        observacoesImportantes: (healthInfo as any).observacoesImportantes || '',
        dataNascimento: healthInfo.dataNascimento || '',
      };

      const apiUser = await api.put<ApiUsuarioProfile>(`/api/usuarios/${userId}/saude`, payloadSaude);
      const updated = this.mapToUserProfile(apiUser);
      this.notify(updated);
      return updated;
    } catch (error) {
      console.error('Erro ao atualizar informações de saúde:', error);
      throw error;
    }
  }

  async updatePhoto(
    fotoUri: string | undefined,
    fileName?: string,
    mimeType?: string
  ): Promise<UserProfile> {
    if (!fotoUri) return this.getProfile();

    // 1. Salva imediatamente na sessão local do aplicativo e notifica os inscritos
    await sessionStore.updateFoto(fotoUri);
    medicationService.notify();

    const user = await sessionStore.restore();
    const userId = Number(user?.id || 1);

    const localProfile: UserProfile = {
      id: String(userId),
      nome: user?.nome || '',
      email: user?.email || '',
      telefone: (user as any)?.telefone || '',
      fotoUri: fotoUri,
      dataNascimento: '',
      healthInfo: {
        dataNascimento: '',
        tipoSanguineo: '',
        alergias: '',
        condicaoSaude: '',
        observacoesImportantes: '',
      },
    } as UserProfile;

    this.notify(localProfile);

    // 2. Envia para o backend via multipart em segundo plano
    try {
      const fileExtension = fotoUri.split('.').pop() || 'jpg';
      const name = fileName || `foto_perfil_${userId}.${fileExtension}`;
      const type = mimeType || `image/${fileExtension === 'png' ? 'png' : 'jpeg'}`;

      const formData = new FormData();
      formData.append('foto', {
        uri: fotoUri,
        name,
        type,
      } as any);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_URL}/api/usuarios/${userId}/foto`);
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.timeout = 15000;
      xhr.send(formData);
    } catch (error) {
      console.warn('Erro ao enviar foto para o servidor (salvo localmente):', error);
    }

    return localProfile;
  }
}

export const profileService = new ProfileService();