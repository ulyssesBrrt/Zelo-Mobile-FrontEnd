import { Linking, Alert } from 'react-native';
import { api } from './api';
import { sessionStore } from './sessionStore';
import { EmergencyContact } from '../types/sos';

export interface CreateEmergencyContactDTO {
  nome: string;
  parentesco?: string;
  telefone: string;
  principal?: boolean;
}

class SosService {
  private contatoPrincipal: EmergencyContact | null = null;
  private samuNumero: string = '192';
  private listeners: (() => void)[] = [];

  // Pattern de escuta de alterações
  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Erro ao notificar listener do SOS:', err);
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

  /* Buscador de contatos de emergência ajustado para a rota singular do Spring Boot */
  async getContacts(): Promise<EmergencyContact[]> {
    try {
      const userId = await this.getUserId();
      const response = await api.get<any>(`/api/usuarios/${userId}/contato-emergencia`);

      if (!response) return [];

      // Trata resposta caso o backend retorne uma lista ou um único objeto
      if (Array.isArray(response)) {
        return response.map((item) => ({
          id: String(item.id || '1'),
          nome: item.nome,
          parentesco: item.parentesco || item.relacao || 'Contato',
          telefone: item.telefone,
          principal: Boolean(item.principal),
        }));
      }

      if (response.nome || response.telefone) {
        return [{
          id: String(response.id || '1'),
          nome: response.nome,
          parentesco: response.parentesco || response.relacao || 'Contato principal',
          telefone: response.telefone,
          principal: true,
        }];
      }

      return [];
    } catch (error) {
      console.error('Erro ao buscar contatos de emergência do backend:', error);
      return [];
    }
  }

  /* Adiciona / Salva o contato de emergência no MySQL */
  async addContact(dto: CreateEmergencyContactDTO): Promise<{ success: boolean; message?: string }> {
    try {
      const userId = await this.getUserId();
      await api.post(`/api/usuarios/${userId}/contato-emergencia`, {
        nome: dto.nome.trim(),
        parentesco: (dto.parentesco || 'Contato').trim(),
        telefone: dto.telefone.trim(),
      });
      this.notify();
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao adicionar contato de emergência:', error);
      return { success: false, message: error.message || 'Erro ao salvar contato.' };
    }
  }

  /* Deleta o contato de emergência no MySQL */
  async deleteContact(contactId?: string): Promise<{ success: boolean; message?: string }> {
    try {
      const userId = await this.getUserId();
      await api.delete(`/api/usuarios/${userId}/contato-emergencia`);
      this.notify();
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao remover contato de emergência:', error);
      return { success: false, message: error.message || 'Erro ao remover contato.' };
    }
  }

  /* Obtém o contato principal do usuário no backend MySQL.*/
  async getContatoPrincipal(): Promise<EmergencyContact | null> {
    try {
      const userId = await this.getUserId();
      const response = await api.get<EmergencyContact>(`/api/usuarios/${userId}/contato-emergencia`);
      if (response && (response.nome || response.telefone)) {
        this.contatoPrincipal = response;
        return { ...response };
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar contato de emergência do backend:', error);
      return this.contatoPrincipal ? { ...this.contatoPrincipal } : null;
    }
  }

  /* Atualiza e salva o contato de emergência principal do usuário no MySQL.*/
  async setContatoPrincipal(contato: EmergencyContact | null): Promise<void> {
    try {
      const userId = await this.getUserId();
      if (contato) {
        const saved = await api.post<EmergencyContact>(`/api/usuarios/${userId}/contato-emergencia`, contato);
        this.contatoPrincipal = saved || contato;
      } else {
        await api.delete(`/api/usuarios/${userId}/contato-emergencia`);
        this.contatoPrincipal = null;
      }
      this.notify();
    } catch (error) {
      console.error('Erro ao salvar contato de emergência no backend:', error);
      this.contatoPrincipal = contato ? { ...contato } : null;
    }
  }

  /* Obtém os dados do SAMU.*/
  getSamuData(): { nome: string; numero: string; rotulo: string } {
    return {
      nome: 'SAMU',
      numero: this.samuNumero,
      rotulo: 'Contato de emergência',
    };
  }

  /* Inicia o fluxo de chamada telefônica nativa para um número.*/
  async makePhoneCall(phoneNumber: string): Promise<boolean> {
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
    const url = `tel:${cleanNumber}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return true;
      } else {
        Alert.alert(
          'Chamada não suportada',
          `Não foi possível abrir o discador para o número ${phoneNumber}. O dispositivo possui suporte a chamadas telefônicas?`
        );
        return false;
      }
    } catch (error) {
      Alert.alert(
        'Erro na chamada',
        `Não foi possível discar para ${phoneNumber}. Verifique as permissões de chamada do aparelho.`
      );
      return false;
    }
  }

  /* Prepara e envia uma mensagem de emergência via WhatsApp para o contato.*/
  async sendWhatsAppEmergency(phoneNumber: string, customMessage?: string): Promise<boolean> {
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');

    let formattedPhone = cleanNumber;
    if (formattedPhone.length === 10 || formattedPhone.length === 11) {
      formattedPhone = `55${formattedPhone}`;
    }

    const defaultMsg =
      customMessage ||
      '🚨 Preciso de ajuda! Estou acionando uma emergência pelo app Zelo. Por favor, entre em contato comigo assim que possível.';

    const encodedText = encodeURIComponent(defaultMsg);

    const whatsappAppUrl = `whatsapp://send?phone=${formattedPhone}&text=${encodedText}`;
    const whatsappWebUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`;

    try {
      const canOpenApp = await Linking.canOpenURL(whatsappAppUrl);
      if (canOpenApp) {
        await Linking.openURL(whatsappAppUrl);
        return true;
      }

      const canOpenWeb = await Linking.canOpenURL(whatsappWebUrl);
      if (canOpenWeb) {
        await Linking.openURL(whatsappWebUrl);
        return true;
      }

      Alert.alert(
        'WhatsApp indisponível',
        'O aplicativo WhatsApp não está instalado ou disponível neste dispositivo para envio da mensagem.'
      );
      return false;
    } catch {
      try {
        await Linking.openURL(whatsappWebUrl);
        return true;
      } catch {
        Alert.alert(
          'Erro ao abrir WhatsApp',
          'Não foi possível preparar o envio da mensagem no WhatsApp. Tente ligar diretamente para o contato.'
        );
        return false;
      }
    }
  }

  /* Ação completa do botão "Acionar SOS" */
  async triggerSosAction(): Promise<void> {
    const contato = await this.getContatoPrincipal();

    // 1. Inicia chamada para o SAMU 192
    await this.makePhoneCall(this.samuNumero);

    // 2. Prepara mensagem no WhatsApp para o contato principal (se houver cadastrado)
    setTimeout(async () => {
      if (contato && contato.telefone) {
        await this.sendWhatsAppEmergency(contato.telefone);
      }
    }, 1200);
  }
}

export const sosService = new SosService();
