export interface RegisterFormData {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
}

export interface RegisterPayload {
  nome: string;
  email: string;
  senha: string;
}

export interface LoginFormData {
  email: string;
  senha: string;
}

export interface LoginPayload {
  email: string;
  senha: string;
}

export interface User {
  id: string;
  nome: string;
  email: string;
}

export interface RegisterResult {
  success: boolean;
  message?: string;
  user?: User;
}

export interface LoginResult {
  success: boolean;
  message?: string;
  user?: User;

}

export interface ValidationErrors {
  nome?: string;
  email?: string;
  senha?: string;
  confirmarSenha?: string;
}

export interface LoginValidationErrors {
  email?: string;
  senha?: string;
}

