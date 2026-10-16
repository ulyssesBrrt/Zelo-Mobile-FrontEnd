import {
  RegisterFormData,
  ValidationErrors,
  LoginFormData,
  LoginValidationErrors,
} from '../types/auth';

/**
 * Valida o formato de um endereço de e-mail utilizando regex padrão.
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Valida os campos da tela de login.
 */
export function validateLoginForm(data: LoginFormData): {
  isValid: boolean;
  errors: LoginValidationErrors;
} {
  const errors: LoginValidationErrors = {};

  if (!data.email.trim()) {
    errors.email = 'Informe seu e-mail';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Informe um e-mail válido';
  }

  if (!data.senha) {
    errors.senha = 'Informe sua senha';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Valida os campos da tela de cadastro.
 */
export function validateRegisterForm(data: RegisterFormData): {
  isValid: boolean;
  errors: ValidationErrors;
} {
  const errors: ValidationErrors = {};

  if (!data.nome.trim()) {
    errors.nome = 'Informe seu nome completo';
  }

  if (!data.email.trim()) {
    errors.email = 'Informe seu e-mail';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Informe um e-mail válido';
  }

  if (!data.senha) {
    errors.senha = 'Informe sua senha';
  } else if (data.senha.length < 6) {
    errors.senha = 'A senha deve ter pelo menos 6 caracteres';
  }

  if (!data.confirmarSenha) {
    errors.confirmarSenha = 'Confirme sua senha';
  } else if (data.senha !== data.confirmarSenha) {
    errors.confirmarSenha = 'As senhas não coincidem';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

