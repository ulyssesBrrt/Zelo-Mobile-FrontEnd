import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { PerfilScreenNavigationProp } from '../../types/navigation';
import { profileService } from '../../services/profileService';
import { UserProfile, HealthInfo } from '../../types/profile';

interface PerfilScreenProps {
  navigation: PerfilScreenNavigationProp;
}

export const PerfilScreen: React.FC<PerfilScreenProps> = ({ navigation }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Estados dos modais de edição
  const [isEditPersonalModalOpen, setIsEditPersonalModalOpen] = useState(false);
  const [isEditHealthModalOpen, setIsEditHealthModalOpen] = useState(false);

  // Campos de edição pessoal
  const [editNome, setEditNome] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTelefone, setEditTelefone] = useState('');

  // Campos de edição de saúde
  const [editDataNasc, setEditDataNasc] = useState('');
  const [editTipoSanguineo, setEditTipoSanguineo] = useState('');
  const [editAlergias, setEditAlergias] = useState('');
  const [editCondicaoSaude, setEditCondicaoSaude] = useState('');

  useEffect(() => {
    let isMounted = true;
    profileService.getProfile().then((data) => {
      if (isMounted) setProfile(data);
    });

    const unsubscribe = profileService.subscribe((updated) => {
      if (isMounted) setProfile(updated);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleOpenEditPersonal = () => {
    if (!profile) return;
    setEditNome(profile.nome);
    setEditEmail(profile.email);
    setEditTelefone(profile.telefone);
    setIsEditPersonalModalOpen(true);
  };

  const handleSavePersonal = async () => {
    if (!editNome.trim() || !editEmail.trim()) {
      Alert.alert('Atenção', 'Nome e e-mail são obrigatórios.');
      return;
    }
    await profileService.updatePersonalData({
      nome: editNome.trim(),
      email: editEmail.trim(),
      telefone: editTelefone.trim(),
    });
    setIsEditPersonalModalOpen(false);
    Alert.alert('Sucesso', 'Dados pessoais atualizados com sucesso!');
  };

  const handleOpenEditHealth = () => {
    if (!profile) return;
    setEditDataNasc(profile.healthInfo.dataNascimento);
    setEditTipoSanguineo(profile.healthInfo.tipoSanguineo);
    setEditAlergias(profile.healthInfo.alergias);
    setEditCondicaoSaude(profile.healthInfo.condicaoSaude);
    setIsEditHealthModalOpen(true);
  };

  const handleSaveHealth = async () => {
    await profileService.updateHealthInfo({
      dataNascimento: editDataNasc.trim(),
      tipoSanguineo: editTipoSanguineo.trim(),
      alergias: editAlergias.trim(),
      condicaoSaude: editCondicaoSaude.trim(),
    });
    setIsEditHealthModalOpen(false);
    Alert.alert('Sucesso', 'Informações de saúde atualizadas com sucesso!');
  };

  const handleChangePhoto = () => {
    Alert.alert(
      'Foto de Perfil',
      'Escolha uma ação para alterar sua foto de perfil:',
      [
        {
          text: 'Restaurar foto padrão',
          onPress: async () => {
            await profileService.updatePhoto(undefined);
            Alert.alert('Foto', 'Foto restaurada para a foto padrão.');
          },
        },
        {
          text: 'Simular envio de nova foto',
          onPress: async () => {
            // Em ambiente móvel sem biblioteca nativa adicional de galeria, atualiza para registro salvo
            await profileService.updatePhoto('custom_photo_set');
            Alert.alert('Sucesso', 'Nova foto de perfil selecionada com sucesso!');
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const handleOpenSettings = () => {
    Alert.alert(
      'Configurações',
      'Preferências do sistema:\n\n• Notificações ativas: Sim\n• Modo escuro: Automático\n• Versão do app: 1.0.0',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Cabeçalho */}
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Perfil</Text>
              <Text style={styles.subtitle}>
                Gerencie suas informações e preferências
              </Text>
            </View>

            {/* Ícone de Sino de Notificação */}
            <TouchableOpacity
              style={styles.notificationButton}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Notificacoes')}
              accessibilityRole="button"
              accessibilityLabel="Ir para Notificações"
            >
              <Feather name="bell" size={20} color="#1E1E1E" />
            </TouchableOpacity>
          </View>

          {/* Foto de Perfil Central com Botão de Câmera */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <Image
                source={
                  profile?.fotoUri && profile.fotoUri !== 'custom_photo_set'
                    ? { uri: profile.fotoUri }
                    : require('../../../assets/images/user_avatar.png')
                }
                style={styles.avatarImage}
                resizeMode="cover"
              />
            </View>

            {/* Botão circular de câmera para alterar a imagem */}
            <TouchableOpacity
              style={styles.cameraButton}
              activeOpacity={0.8}
              onPress={handleChangePhoto}
              accessibilityRole="button"
              accessibilityLabel="Alterar foto de perfil"
            >
              <Feather name="camera" size={15} color="#5D6B63" />
            </TouchableOpacity>
          </View>

          {/* Cartão 1: Informações Pessoais (Nome completo, E-mail, Telefone) */}
          <View style={styles.card}>
            {/* Nome Completo */}
            <View style={styles.itemRow}>
              <View style={styles.iconCircle}>
                <Feather name="user" size={14} color="#77B28C" />
              </View>
              <View style={styles.itemTextContainer}>
                <Text style={styles.itemLabel}>Nome completo</Text>
                <Text style={styles.itemValue} numberOfLines={1}>
                  {profile?.nome || '—'}
                </Text>
              </View>
            </View>

            {/* E-mail */}
            <View style={styles.itemRow}>
              <View style={styles.iconCircle}>
                <Feather name="mail" size={14} color="#77B28C" />
              </View>
              <View style={styles.itemTextContainer}>
                <Text style={styles.itemLabel}>E-mail</Text>
                <Text style={styles.itemValue} numberOfLines={1}>
                  {profile?.email || '—'}
                </Text>
              </View>
            </View>

            {/* Telefone */}
            <View style={styles.itemRow}>
              <View style={styles.iconCircle}>
                <Feather name="phone" size={14} color="#77B28C" />
              </View>
              <View style={styles.itemTextContainer}>
                <Text style={styles.itemLabel}>Telefone</Text>
                <Text style={styles.itemValue} numberOfLines={1}>
                  {profile?.telefone || '—'}
                </Text>
              </View>
            </View>
          </View>

          {/* Cartão 2: Informações de Saúde */}
          <View style={styles.card}>
            {/* Título da Seção Saúde com Seta */}
            <TouchableOpacity
              style={styles.actionRow}
              activeOpacity={0.7}
              onPress={handleOpenEditHealth}
              accessibilityRole="button"
              accessibilityLabel="Editar informações de saúde"
            >
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons
                  name="heart-pulse"
                  size={15}
                  color="#77B28C"
                />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Informações de saúde</Text>
                <Text style={styles.itemLabel}>
                  Dados importantes da sua saúde
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color="#5D6B63" />
            </TouchableOpacity>

            {/* Data de Nascimento */}
            <View style={styles.itemRow}>
              <View style={styles.iconCircle}>
                <Feather name="calendar" size={14} color="#77B28C" />
              </View>
              <View style={styles.itemTextContainer}>
                <Text style={styles.itemLabel}>Data de nascimento</Text>
                <Text style={styles.itemValue}>
                  {profile?.healthInfo.dataNascimento || '—'}
                </Text>
              </View>
            </View>

            {/* Tipo Sanguíneo */}
            <View style={styles.itemRow}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons
                  name="water"
                  size={15}
                  color="#77B28C"
                />
              </View>
              <View style={styles.itemTextContainer}>
                <Text style={styles.itemLabel}>Tipo sanguíneo</Text>
                <Text style={styles.itemValue}>
                  {profile?.healthInfo.tipoSanguineo || '—'}
                </Text>
              </View>
            </View>

            {/* Alergias */}
            <View style={styles.itemRow}>
              <View style={styles.iconCircle}>
                <Feather name="shield" size={14} color="#77B28C" />
              </View>
              <View style={styles.itemTextContainer}>
                <Text style={styles.itemLabel}>Alergias</Text>
                <Text style={styles.itemValue}>
                  {profile?.healthInfo.alergias || 'Nenhuma informada'}
                </Text>
              </View>
            </View>

            {/* Condição de Saúde */}
            <View style={styles.itemRow}>
              <View style={styles.iconCircle}>
                <Feather name="file-text" size={14} color="#77B28C" />
              </View>
              <View style={styles.itemTextContainer}>
                <Text style={styles.itemLabel}>Condição de saúde</Text>
                <Text style={styles.itemValue}>
                  {profile?.healthInfo.condicaoSaude || 'Nenhuma informada'}
                </Text>
              </View>
            </View>
          </View>

          {/* Cartão 3: Ações e Navegações Adicionais */}
          <View style={styles.card}>
            {/* Opção: Editar Perfil */}
            <TouchableOpacity
              style={styles.actionRow}
              activeOpacity={0.7}
              onPress={handleOpenEditPersonal}
              accessibilityRole="button"
              accessibilityLabel="Editar perfil"
            >
              <View style={styles.iconCircle}>
                <Feather name="edit-3" size={14} color="#77B28C" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Editar perfil</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#5D6B63" />
            </TouchableOpacity>

            {/* Opção: Contatos de Emergência */}
            <TouchableOpacity
              style={styles.actionRow}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('SOS')}
              accessibilityRole="button"
              accessibilityLabel="Ir para Contatos de emergência"
            >
              <View style={styles.iconCircleRed}>
                <Feather name="phone" size={14} color="#E42C24" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Contatos de emergência</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#5D6B63" />
            </TouchableOpacity>

            {/* Opção: Configurações */}
            <TouchableOpacity
              style={styles.actionRow}
              activeOpacity={0.7}
              onPress={handleOpenSettings}
              accessibilityRole="button"
              accessibilityLabel="Configurações"
            >
              <View style={styles.iconCircle}>
                <Feather name="settings" size={14} color="#77B28C" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Configurações</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#5D6B63" />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Barra de Navegação Inferior Fixa com Perfil Ativo */}
        <View style={styles.bottomBarContainer}>
          <View style={styles.bottomBar}>
            {/* Tab: Home */}
            <TouchableOpacity
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Home')}
              accessibilityRole="tab"
              accessibilityState={{ selected: false }}
              accessibilityLabel="Tela Principal"
            >
              <Feather name="home" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>

            {/* Tab: Medicamentos */}
            <TouchableOpacity
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Medicamentos')}
              accessibilityRole="tab"
              accessibilityState={{ selected: false }}
              accessibilityLabel="Medicamentos"
            >
              <MaterialCommunityIcons
                name="pill"
                size={24}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>

            {/* Tab: Agenda */}
            <TouchableOpacity
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Agenda')}
              accessibilityRole="tab"
              accessibilityState={{ selected: false }}
              accessibilityLabel="Agenda"
            >
              <Feather name="calendar" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>

            {/* Tab: Perfil (ATIVO com destaque #D7F0DF) */}
            <TouchableOpacity
              style={styles.activeTabItem}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: true }}
              accessibilityLabel="Perfil"
            >
              <Feather name="user" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal: Editar Dados Pessoais */}
        <Modal
          visible={isEditPersonalModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsEditPersonalModalOpen(false)}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Editar Perfil</Text>
                <TouchableOpacity
                  onPress={() => setIsEditPersonalModalOpen(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather name="x" size={22} color="#5D6B63" />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Nome completo</Text>
              <TextInput
                style={styles.inputField}
                value={editNome}
                onChangeText={setEditNome}
                placeholder="Seu nome completo"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.inputLabel}>E-mail</Text>
              <TextInput
                style={styles.inputField}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="seu.email@exemplo.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Telefone</Text>
              <TextInput
                style={styles.inputField}
                value={editTelefone}
                onChangeText={setEditTelefone}
                placeholder="(00) 00000-0000"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setIsEditPersonalModalOpen(false)}
                >
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSaveButton}
                  onPress={handleSavePersonal}
                >
                  <Text style={styles.modalSaveText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Modal: Editar Informações de Saúde */}
        <Modal
          visible={isEditHealthModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsEditHealthModalOpen(false)}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Informações de Saúde</Text>
                <TouchableOpacity
                  onPress={() => setIsEditHealthModalOpen(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather name="x" size={22} color="#5D6B63" />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Data de nascimento</Text>
              <TextInput
                style={styles.inputField}
                value={editDataNasc}
                onChangeText={setEditDataNasc}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.inputLabel}>Tipo sanguíneo</Text>
              <TextInput
                style={styles.inputField}
                value={editTipoSanguineo}
                onChangeText={setEditTipoSanguineo}
                placeholder="Ex: O+, A-, etc."
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.inputLabel}>Alergias</Text>
              <TextInput
                style={styles.inputField}
                value={editAlergias}
                onChangeText={setEditAlergias}
                placeholder="Ex: Abelha, Penicilina"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.inputLabel}>Condição de saúde</Text>
              <TextInput
                style={styles.inputField}
                value={editCondicaoSaude}
                onChangeText={setEditCondicaoSaude}
                placeholder="Ex: Diabético, Hipertensão"
                placeholderTextColor="#9CA3AF"
              />

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setIsEditHealthModalOpen(false)}
                >
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSaveButton}
                  onPress={handleSaveHealth}
                >
                  <Text style={styles.modalSaveText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 110, // Espaço para a barra de navegação inferior
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E1E1E',
    lineHeight: 32,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5D6B63',
    lineHeight: 20,
  },
  notificationButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  avatarSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
    alignSelf: 'center',
    width: 110,
    height: 104,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8ECEB',
  },
  avatarImage: {
    width: 100,
    height: 100,
  },
  cameraButton: {
    position: 'absolute',
    right: 4,
    bottom: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8ECEB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    gap: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    justifyContent: 'space-between',
  },
  actionTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E1E1E',
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#C9E2D1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleRed: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F3BABA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTextContainer: {
    flex: 1,
    gap: 3,
  },
  itemLabel: {
    fontSize: 11,
    color: '#5D6B63',
    fontWeight: '400',
  },
  itemValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E1E1E',
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 12,
    left: 20,
    right: 20,
  },
  bottomBar: {
    height: 70,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  tabItem: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTabItem: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#D7F0DF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Estilos do Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E1E1E',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5D6B63',
    marginBottom: 6,
    marginTop: 8,
  },
  inputField: {
    backgroundColor: '#F9FAFA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E1E1E',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  modalCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5D6B63',
  },
  modalSaveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
