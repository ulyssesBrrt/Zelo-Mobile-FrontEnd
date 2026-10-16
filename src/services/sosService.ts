import { Linking, Alert, Platform } from 'react-native';
import { EmergencyContact } from '../types/sos';

class SosService {
  // Contato principal dinâmico (inicialmente carregado a partir do cadastro do usuário, permitindo atualização)
  private contatoPrincipal: EmergencyContact = {
    id: 'contact_01',
    nome: 'Maria Pereira',
    telefone: '(74) 9918-3421',
    parentesco: 'Contato principal',
  };

  private samuNumero: string = '192';

  /**
   * Obtém o contato principal do usuário.
   */
  async getContatoPrincipal(): Promise<EmergencyContact> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return { ...this.contatoPrincipal };
  }

  /**
   * Atualiza o contato de emergência do usuário.
   */
  async setContatoPrincipal(contato: EmergencyContact): Promise<void> {
    this.contatoPrincipal = { ...contato };
  }

  /**
   * Obtém os dados do SAMU.
   */
  getSamuData(): { nome: string; numero: string; rotulo: string } {
    return {
      nome: 'SAMU',
      numero: this.samuNumero,
      rotulo: 'Contato de emergência',
    };
  }

  /**
   * Inicia o fluxo de chamada telefônica nativa para um número.
   * Se não for possível iniciar diretamente, abre o discador com o número preenchido.
   */
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

  /**
   * Prepara e envia uma mensagem de emergência via WhatsApp para o contato principal.
   * Se a localização não estiver disponível por falta de módulo GPS nativo, envia a mensagem clara de socorro.
   */
  async sendWhatsAppEmergency(phoneNumber: string, customMessage?: string): Promise<boolean> {
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');

    // Se não tiver DDI (ex: 7499183421 -> 10 ou 11 dígitos), adiciona código do Brasil 55
    let formattedPhone = cleanNumber;
    if (formattedPhone.length === 10 || formattedPhone.length === 11) {
      formattedPhone = `55${formattedPhone}`;
    }

    const defaultMsg =
      customMessage ||
      '🚨 Preciso de ajuda! Estou acionando uma emergência pelo app Zelo. Por favor, entre em contato comigo assim que possível.';

    const encodedText = encodeURIComponent(defaultMsg);

    // Tenta primeiro abrir pelo esquema nativo do WhatsApp, se não abre o link universal api.whatsapp.com
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
      // Fallback para web URL
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

  /**
   * Ação completa do botão "Acionar SOS":
   * 1. Disca imediatamente ou abre o discador com o SAMU (192).
   * 2. Prepara a mensagem de socorro no WhatsApp para o contato principal.
   */
  async triggerSosAction(): Promise<void> {
    // 1. Inicia chamada para o SAMU 192
    await this.makePhoneCall(this.samuNumero);

    // 2. Prepara mensagem no WhatsApp para o contato principal
    setTimeout(async () => {
      if (this.contatoPrincipal.telefone) {
        await this.sendWhatsAppEmergency(this.contatoPrincipal.telefone);
      }
    }, 1200);
  }
}

export const sosService = new SosService();
