import {
  RegisterPayload,
  RegisterResult,
  LoginPayload,
  LoginResult,
} from '../types/auth';

/**
 * Serviço de autenticação / cadastro de usuários.
 * Neste MVP, utiliza uma simulação assíncrona local para permitir testes da interface.
 * Quando o backend estiver pronto, este serviço deve ser atualizado para realizar a chamada HTTP correspondente.
 */
class AuthService {
  async register(payload: RegisterPayload): Promise<RegisterResult> {
    // Simula latência de rede típica de uma API real (800ms)
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Validação de segurança básica na camada de serviço
    if (!payload.nome.trim() || !payload.email.trim() || !payload.senha.trim()) {
      return {
        success: false,
        message: 'Preencha todos os campos obrigatórios.',
      };
    }

    // Sucesso simulado
    return {
      success: true,
      message: 'Conta criada com sucesso!',
      user: {
        id: 'usr_' + Date.now().toString(36),
        nome: payload.nome.trim(),
        email: payload.email.trim().toLowerCase(),
      },
    };
  }

  async login(payload: LoginPayload): Promise<LoginResult> {
    // Simula latência de rede típica de uma API real (800ms)
    await new Promise((resolve) => setTimeout(resolve, 800));

    const email = payload.email.trim().toLowerCase();
    const senha = payload.senha;

    if (!email || !senha) {
      return {
        success: false,
        message: 'Preencha todos os campos obrigatórios.',
      };
    }

    // Simulação de credenciais inválidas para cenários de teste específicos
    if (email === 'erro@teste.com' || senha === 'senhaerrada') {
      return {
        success: false,
        message: 'E-mail ou senha incorretos.',
      };
    }

    // Sucesso simulado
    return {
      success: true,
      message: 'Login realizado com sucesso!',
      user: {
        id: 'usr_' + Date.now().toString(36),
        nome: email.split('@')[0],
        email,
      },
      token: 'mock_jwt_token_' + Date.now().toString(36),
    };
  }
}

export const authService = new AuthService();

