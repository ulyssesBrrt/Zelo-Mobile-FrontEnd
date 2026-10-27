import { api, ApiError } from './api';
import { ApiUsuario } from '../types/api';
import {
  RegisterPayload,
  RegisterResult,
  LoginPayload,
  LoginResult,
  User
} from '../types/auth';

/**
 * Função auxiliar para converter a resposta da API (ApiUsuario) 
 * para o formato que as telas já esperam (User), descartando a senha.
 */
const toUser = (u: ApiUsuario): User => ({
  id: String(u.id),
  nome: u.nome,
  email: u.email
});

class AuthService {
  async register(payload: RegisterPayload): Promise<RegisterResult> {
    // Mantemos a sua validação exata para não quebrar a interface visual
    if (!payload.nome.trim() || !payload.email.trim() || !payload.senha?.trim()) {
      return {
        success: false,
        message: 'Preencha todos os campos obrigatórios.',
      };
    }

    try {
      // Chamada real para o backend
      const u = await api.post<ApiUsuario>('/api/auth/cadastro', {
        nome: payload.nome.trim(),
        email: payload.email.trim(),
        senha: payload.senha
      });

      return {
        success: true,
        message: 'Conta criada com sucesso!',
        user: toUser(u),
      };
    } catch (e) {
      // Trata erro de rede (servidor desligado, sem internet, etc)
      if (e instanceof ApiError && e.status === 0) {
        return { success: false, message: e.message };
      }
      // O Spring Boot vai dar erro 500 se o email já existir no banco de dados
      return {
        success: false,
        message: 'Não foi possível criar a conta. O e-mail pode já estar em uso.',
      };
    }
  }

  async login(payload: LoginPayload): Promise<LoginResult> {
    const email = payload.email.trim();
    const senha = payload.senha;

    // Mantemos a sua validação exata para não quebrar a interface visual
    if (!email || !senha) {
      return {
        success: false,
        message: 'Preencha todos os campos obrigatórios.',
      };
    }

    try {
      // Chamada real para o backend
      const u = await api.post<ApiUsuario>('/api/auth/login', {
        email,
        senha
      });

      return {
        success: true,
        message: 'Login realizado com sucesso!',
        user: toUser(u),
      };
    } catch (e) {
      // Se o backend retornar 401 (Unauthorized), mostramos a sua mensagem exata de erro
      if (e instanceof ApiError && e.status === 401) {
        return {
          success: false,
          message: 'E-mail ou senha incorretos.',
        };
      }

      // Erro genérico / servidor desligado
      return {
        success: false,
        message: e instanceof ApiError ? e.message : 'Erro inesperado no servidor.',
      };
    }
  }
}

export const authService = new AuthService();