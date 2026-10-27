import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants/theme';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { authService } from '../../services/authService';
import { LoginFormData, LoginValidationErrors } from '../../types/auth';
import { LoginScreenNavigationProp } from '../../types/navigation';
import { validateLoginForm } from '../../utils/validation';

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  // Aqui pegamos a função signIn do AuthContext
  const { signIn } = useAuth();

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    senha: '',
  });

  const [errors, setErrors] = useState<LoginValidationErrors>({});
  const [showSenha, setShowSenha] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Refs para fluxo sequencial entre os campos via teclado (E-mail -> Senha -> Entrar)
  const emailInputRef = useRef<TextInput>(null);
  const senhaInputRef = useRef<TextInput>(null);

  const updateField = (field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpa o erro específico ao digitar
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (authError) {
      setAuthError(null);
    }
  };

  const handleLogin = async () => {
    if (isLoading) return;

    const { isValid, errors: validationErrors } = validateLoginForm(formData);

    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setAuthError(null);
    setIsLoading(true);

    try {
      const response = await authService.login({
        email: formData.email,
        senha: formData.senha,
      });

      if (response.success && response.user) {
        // Substituímos o navigation.navigate pelo signIn do contexto
        await signIn(response.user);
      } else {
        const errorMsg =
          response.message || 'Credenciais inválidas. Verifique e-mail e senha.';
        setAuthError(errorMsg);
        Alert.alert('Erro no login', errorMsg);
      }
    } catch {
      const genericError = 'Ocorreu um erro inesperado. Tente novamente mais tarde.';
      setAuthError(genericError);
      Alert.alert('Erro', genericError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // Preparado para fluxo futuro de recuperação de senha, sem criar tela nova
    Alert.alert(
      'Recuperação de Senha',
      'A funcionalidade de recuperação de senha estará disponível em breve.'
    );
  };

  const handleNavigateToCadastro = () => {
    navigation.navigate('Cadastro');
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Logotipo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
              accessibilityRole="image"
              accessibilityLabel="Logotipo Zelo"
            />
          </View>

          {/* Cabeçalho */}
          <Text style={styles.title}>Entrar</Text>
          <Text style={styles.subtitle}>
            Bem-vindo de volta! Que bom te ver por aqui.
          </Text>

          {/* Banner de erro de autenticação, se houver */}
          {authError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{authError}</Text>
            </View>
          ) : null}

          {/* Formulário */}
          <View style={styles.form}>
            {/* Campo: E-mail */}
            <Input
              ref={emailInputRef}
              iconName="mail"
              placeholder="E-mail"
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => senhaInputRef.current?.focus()}
              blurOnSubmit={false}
              accessibilityLabel="Campo de E-mail"
            />

            {/* Campo: Senha */}
            <Input
              ref={senhaInputRef}
              iconName="lock"
              placeholder="Senha"
              isPassword
              isPasswordVisible={showSenha}
              onTogglePasswordVisibility={() => setShowSenha(!showSenha)}
              value={formData.senha}
              onChangeText={(text) => updateField('senha', text)}
              error={errors.senha}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              autoCapitalize="none"
              accessibilityLabel="Campo de Senha"
              wrapperStyle={styles.passwordWrapper}
            />

            {/* Esqueci minha senha → */}
            <TouchableOpacity
              onPress={handleForgotPassword}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.forgotPasswordButton}
              accessibilityRole="button"
              accessibilityLabel="Esqueci minha senha"
            >
              <Text style={styles.forgotPasswordText}>
                Esqueci minha senha →
              </Text>
            </TouchableOpacity>

            {/* Botão Entrar */}
            <Button
              title="Entrar"
              isLoading={isLoading}
              onPress={handleLogin}
              style={styles.submitButton}
            />
          </View>

          {/* Divisor "ou" */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Chamada para Cadastro */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Não possui uma conta? </Text>
            <TouchableOpacity
              onPress={handleNavigateToCadastro}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              accessibilityRole="link"
              accessibilityLabel="Não possui uma conta? Criar conta"
            >
              <Text style={styles.footerLink}>Criar →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.card,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 32,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
      },
      android: {
        elevation: 2,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
      },
    }),
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 44,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorBanner: {
    width: '100%',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  errorBannerText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  passwordWrapper: {
    marginBottom: 10,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    paddingVertical: 2,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  submitButton: {
    marginTop: 0,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  footerLink: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
});