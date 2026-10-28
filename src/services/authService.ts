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
    if (!payload.nome?.trim() || !payload.email?.trim() || !payload.senha?.trim()) {
      return {
        success: false,
        message: 'Preencha todos os campos obrigatórios.',
      };
    }

    const body = {
      nome: payload.nome.trim(),
      email: payload.email.trim(),
      senha: payload.senha
    };

    try {
      let u: ApiUsuario;

      // Tenta a rota padrão /api/auth/cadastro e faz fallback para /cadastro em caso de 404
      try {
        u = await api.post<ApiUsuario>('/api/auth/cadastro', body);
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) {
          u = await api.post<ApiUsuario>('/cadastro', body);
        } else {
          throw e;
        }
      }

      return {
        success: true,
        message: 'Conta criada com sucesso!',
        user: toUser(u),
      };
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 0) {
          return {
            success: false,
            message: 'Servidor indisponível. Verifique se a API no Render está ativa.'
          };
        }
        if (e.status === 400) {
          return {
            success: false,
            message: 'Dados de cadastro inválidos. Verifique os campos preenchidos.'
          };
        }
      }

      return {
        success: false,
        message: 'Não foi possível criar a conta. O e-mail pode já estar em uso.',
      };
    }
  }

  async login(payload: LoginPayload): Promise<LoginResult> {
    const email = payload.email?.trim();
    const senha = payload.senha;

    if (!email || !senha) {
      return {
        success: false,
        message: 'Preencha todos os campos obrigatórios.',
      };
    }

    const body = { email, senha };

    try {
      let u: ApiUsuario;

      // Tenta a rota padrão /api/auth/login e faz fallback para /login se der 404
      try {
        u = await api.post<ApiUsuario>('/api/auth/login', body);
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) {
          u = await api.post<ApiUsuario>('/login', body);
        } else {
          throw e;
        }
      }

      return {
        success: true,
        message: 'Login realizado com sucesso!',
        user: toUser(u),
      };
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 401) {
          return {
            success: false,
            message: 'E-mail ou senha incorretos.',
          };
        }
        if (e.status === 400) {
          return {
            success: false,
            message: 'Requisição inválida. Verifique os dados digitados.',
          };
        }
        if (e.status === 0) {
          return {
            success: false,
            message: 'Não foi possível conectar ao servidor no Render.',
          };
        }
      }

      return {
        success: false,
        message: e instanceof ApiError ? e.message : 'Erro inesperado no servidor.',
      };
    }
  }
}

export const authService = new AuthService();