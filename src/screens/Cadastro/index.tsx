import React, { useState, useRef } from 'react';
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
import { RegisterFormData, ValidationErrors } from '../../types/auth';
import { CadastroScreenNavigationProp } from '../../types/navigation';
import { validateRegisterForm } from '../../utils/validation';

export const CadastroScreen: React.FC = () => {
  const navigation = useNavigation<CadastroScreenNavigationProp>();

  const [formData, setFormData] = useState<RegisterFormData>({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showSenha, setShowSenha] = useState<boolean>(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Refs para navegação sequencial entre os campos via teclado
  const emailInputRef = useRef<TextInput>(null);
  const senhaInputRef = useRef<TextInput>(null);
  const confirmarSenhaInputRef = useRef<TextInput>(null);

  const updateField = (field: keyof RegisterFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpa o erro do campo ao digitar
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (successMessage) {
      setSuccessMessage(null);
    }
  };

  const handleRegister = async () => {
    const { isValid, errors: validationErrors } = validateRegisterForm(formData);

    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const response = await authService.register({
        nome: formData.nome,
        email: formData.email,
        senha: formData.senha,
      });

      if (response.success) {
        setSuccessMessage('Conta criada com sucesso!');
        Alert.alert('Sucesso', 'Sua conta foi criada com sucesso!', [
          {
            text: 'Acessar início',
            onPress: () => {
              navigation.navigate('Home');
            },
          },
        ]);
      } else {
        Alert.alert('Erro', response.message || 'Falha ao cadastrar. Tente novamente.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateToLogin = () => {
    navigation.navigate('Login');
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
            />
          </View>

          {/* Cabeçalho */}
          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>
            Comece a organizar sua rotina de saúde
          </Text>

          {/* Feedback de sucesso, se houver */}
          {successMessage ? (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}

          {/* Formulário */}
          <View style={styles.form}>
            {/* Campo: Nome completo */}
            <Input
              iconName="user"
              placeholder="Nome completo"
              value={formData.nome}
              onChangeText={(text) => updateField('nome', text)}
              error={errors.nome}
              returnKeyType="next"
              onSubmitEditing={() => emailInputRef.current?.focus()}
              blurOnSubmit={false}
              autoCapitalize="words"
            />

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
              returnKeyType="next"
              onSubmitEditing={() => senhaInputRef.current?.focus()}
              blurOnSubmit={false}
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
              returnKeyType="next"
              onSubmitEditing={() => confirmarSenhaInputRef.current?.focus()}
              blurOnSubmit={false}
              autoCapitalize="none"
            />

            {/* Campo: Confirmar senha */}
            <Input
              ref={confirmarSenhaInputRef}
              iconName="lock"
              placeholder="Confirmar senha"
              isPassword
              isPasswordVisible={showConfirmarSenha}
              onTogglePasswordVisibility={() =>
                setShowConfirmarSenha(!showConfirmarSenha)
              }
              value={formData.confirmarSenha}
              onChangeText={(text) => updateField('confirmarSenha', text)}
              error={errors.confirmarSenha}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
              autoCapitalize="none"
            />

            {/* Botão Criar Conta */}
            <Button
              title="Criar conta"
              isLoading={isLoading}
              onPress={handleRegister}
              style={styles.submitButton}
            />
          </View>

          {/* Divisor "ou" */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Chamada para Login */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Já possui uma conta? </Text>
            <TouchableOpacity
              onPress={handleNavigateToLogin}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              accessibilityRole="link"
              accessibilityLabel="Já possui uma conta? Entrar"
            >
              <Text style={styles.footerLink}>Entrar →</Text>
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
  successBanner: {
    width: '100%',
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  successText: {
    color: COLORS.primaryDark,
    fontSize: 13,
    fontWeight: '500',
  },
  form: {
    width: '100%',
  },
  submitButton: {
    marginTop: 8,
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
