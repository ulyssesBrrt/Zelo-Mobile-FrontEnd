import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { SOSScreenNavigationProp, RootStackParamList } from '../../types/navigation';
import { EmergencyContact } from '../../types/sos';
import { sosService } from '../../services/sosService';

export const SOSScreen: React.FC = () => {
  const navigation = useNavigation<SOSScreenNavigationProp>();

  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [contatoPrincipal, setContatoPrincipal] = useState<EmergencyContact | null>(null);
  const [samuInfo] = useState<{ nome: string; numero: string; rotulo: string }>(
    sosService.getSamuData()
  );
  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState<boolean>(false);

  // Campos do formulário
  const [nome, setNome] = useState('');
  const [parentesco, setParentesco] = useState('');
  const [telefone, setTelefone] = useState('');

  // Carrega os dados dos contatos
  const loadContacts = useCallback(async () => {
    try {
      const list = await sosService.getContacts();
      setContacts(list);

      const main = await sosService.getContatoPrincipal();
      setContatoPrincipal(main || (list.length > 0 ? list[0] : null));
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os dados de contato de emergência.');
    }
  }, []);

  useEffect(() => {
    loadContacts();
    const unsubscribe = sosService.subscribe(() => {
      loadContacts();
    });
    return () => unsubscribe();
  }, [loadContacts]);

  const navigateTo = (routeName: keyof RootStackParamList, params?: any) => {
    const routeNames = navigation.getState()?.routeNames || [];
    if (routeNames.includes(routeName)) {
      navigation.navigate(routeName as any, params);
    } else {
      Alert.alert(
        'Navegação',
        `A tela "${routeName}" foi preparada e será implementada posteriormente.`
      );
    }
  };

  // Botão vermelho grande: "Acionar SOS"
  const handleAcionarSos = async () => {
    if (isCalling) return;
    setIsCalling(true);

    try {
      await sosService.triggerSosAction();
    } catch {
      Alert.alert(
        'Falha no acionamento',
        'Ocorreu uma falha ao acionar a emergência. Você pode ligar diretamente tocando nos botões de chamada abaixo.'
      );
    } finally {
      setTimeout(() => {
        setIsCalling(false);
      }, 1500);
    }
  };

  // Botão "Ligar" para Contato
  const handleLigarContato = async (phone?: string) => {
    if (!phone) {
      Alert.alert('Aviso', 'Nenhum telefone cadastrado para este contato.');
      return;
    }
    await sosService.makePhoneCall(phone);
  };

  // Botão "Ligar" para SAMU (192)
  const handleLigarSamu = async () => {
    await sosService.makePhoneCall(samuInfo.numero);
  };

  // Salvar Novo Contato
  const handleAddContact = async () => {
    if (!nome.trim() || !telefone.trim()) {
      Alert.alert('Atenção', 'Informe pelo menos o nome e o telefone do contato.');
      return;
    }

    const response = await sosService.addContact({
      nome,
      parentesco: parentesco || 'Contato',
      telefone,
      principal: contacts.length === 0,
    });

    if (response.success) {
      Alert.alert('Sucesso', 'Contato de emergência adicionado com sucesso!');
      setNome('');
      setParentesco('');
      setTelefone('');
      setIsAddModalVisible(false);
    } else {
      Alert.alert('Erro', response.message || 'Falha ao salvar contato.');
    }
  };

  // Excluir Contato
  const handleDeleteContact = (id?: string, name?: string) => {
    if (!id) return;
    Alert.alert('Excluir Contato', `Deseja remover ${name || 'este contato'} dos contatos de emergência?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          await sosService.deleteContact(id);
        },
      },
    ]);
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
            <Text style={styles.title}>S.O.S</Text>
            <Text style={styles.subtitle}>Precisa de ajuda?</Text>
          </View>

          {/* Botão Vermelho Grande: Acionar SOS */}
          <View style={styles.sosButtonContainer}>
            <TouchableOpacity
              style={[styles.sosButton, isCalling && styles.sosButtonDisabled]}
              activeOpacity={0.85}
              onPress={handleAcionarSos}
              disabled={isCalling}
              accessibilityRole="button"
              accessibilityLabel="Acionar SOS: Iniciar ligação de emergência para o SAMU e enviar mensagem de socorro no WhatsApp"
            >
              <View style={styles.sirenCircle}>
                <MaterialCommunityIcons
                  name="alarm-light-outline"
                  size={42}
                  color="#E42C24"
                />
              </View>
              <Text style={styles.sosButtonText}>Acionar SOS</Text>
            </TouchableOpacity>
          </View>

          {/* Chamada de Alerta */}
          <View style={styles.alertBox}>
            <View style={styles.alertIconCircle}>
              <Feather name="alert-circle" size={18} color="#E42C24" />
            </View>
            <Text style={styles.alertText}>
              Toque no botão para entrar {'\n'}em contato com uma pessoa de emergência
            </Text>
          </View>

          {/* Seção: Contatos de emergência */}
          <View style={styles.contactsSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Contatos de emergência</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setIsAddModalVisible(true)}
                activeOpacity={0.7}
              >
                <Feather name="plus" size={16} color={COLORS.primary} />
                <Text style={styles.addButtonText}>Adicionar</Text>
              </TouchableOpacity>
            </View>

            {/* SAMU 192 (Sempre visível) */}
            <View style={styles.contactCard}>
              <View style={styles.avatarBoxRed}>
                <MaterialCommunityIcons
                  name="hospital-box-outline"
                  size={32}
                  color="#E42C24"
                />
              </View>

              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>{samuInfo.rotulo}</Text>
                <Text style={styles.contactName} numberOfLines={1}>
                  {samuInfo.nome}
                </Text>
                <View style={styles.phoneRow}>
                  <Feather
                    name="phone"
                    size={12}
                    color="#5D6B63"
                    style={styles.phoneIcon}
                  />
                  <Text style={styles.phoneText}>{samuInfo.numero}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.callButtonRed}
                activeOpacity={0.75}
                onPress={handleLigarSamu}
                accessibilityRole="button"
                accessibilityLabel="Ligar para o SAMU no número 192"
              >
                <Feather
                  name="phone"
                  size={14}
                  color="#E42C24"
                  style={styles.callIcon}
                />
                <Text style={styles.callTextRed}>Ligar</Text>
              </TouchableOpacity>
            </View>

            {/* Contatos Pessoais Registrados */}
            {contacts.length === 0 ? (
              <View style={styles.contactCard}>
                <View style={styles.avatarBoxGreen}>
                  <Feather name="user" size={32} color="#77B28C" />
                </View>

                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Contato principal</Text>
                  <Text style={styles.contactName} numberOfLines={1}>
                    Nenhum contato cadastrado
                  </Text>
                  <View style={styles.phoneRow}>
                    <Feather
                      name="phone"
                      size={12}
                      color="#5D6B63"
                      style={styles.phoneIcon}
                    />
                    <Text style={styles.phoneText}>—</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.callButtonGreen}
                  activeOpacity={0.75}
                  onPress={() => setIsAddModalVisible(true)}
                >
                  <Feather name="plus" size={14} color="#77B28C" style={styles.callIcon} />
                  <Text style={styles.callTextGreen}>Adicionar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              contacts.map((c) => (
                <View key={c.id || c.telefone} style={styles.contactCard}>
                  <View style={styles.avatarBoxGreen}>
                    <Feather name="user" size={32} color="#77B28C" />
                  </View>

                  <View style={styles.contactInfo}>
                    <Text style={styles.contactLabel}>
                      {c.parentesco || 'Contato de confiança'}
                    </Text>
                    <Text style={styles.contactName} numberOfLines={1}>
                      {c.nome}
                    </Text>
                    <View style={styles.phoneRow}>
                      <Feather
                        name="phone"
                        size={12}
                        color="#5D6B63"
                        style={styles.phoneIcon}
                      />
                      <Text style={styles.phoneText}>{c.telefone}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.callButtonGreen}
                    activeOpacity={0.75}
                    onPress={() => handleLigarContato(c.telefone)}
                  >
                    <Feather
                      name="phone"
                      size={14}
                      color="#77B28C"
                      style={styles.callIcon}
                    />
                    <Text style={styles.callTextGreen}>Ligar</Text>
                  </TouchableOpacity>

                  {c.id && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteContact(c.id, c.nome)}
                    >
                      <Feather name="trash-2" size={16} color="#B8C0BC" />
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Barra de Navegação Inferior Flutuante */}
        <View style={styles.bottomBarContainer}>
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => navigateTo('Home')}
            >
              <Feather name="home" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => navigateTo('Medicamentos')}
            >
              <MaterialCommunityIcons
                name="pill"
                size={24}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => navigateTo('Agenda')}
            >
              <Feather name="calendar" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => navigateTo('Perfil')}
            >
              <Feather name="user" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal para Adicionar Contato */}
        <Modal
          visible={isAddModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsAddModalVisible(false)}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Novo Contato de Emergência</Text>
                <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                  <Feather name="x" size={20} color="#5D6B63" />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Nome Completo</Text>
              <TextInput
                style={styles.inputField}
                value={nome}
                onChangeText={setNome}
                placeholder="Ex: Maria Silva"
              />

              <Text style={styles.inputLabel}>Parentesco / Relação</Text>
              <TextInput
                style={styles.inputField}
                value={parentesco}
                onChangeText={setParentesco}
                placeholder="Ex: Filha, Cuidador, Médico"
              />

              <Text style={styles.inputLabel}>Telefone com DDD</Text>
              <TextInput
                style={styles.inputField}
                value={telefone}
                onChangeText={setTelefone}
                placeholder="Ex: (74) 99999-8888"
                keyboardType="phone-pad"
              />

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setIsAddModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSaveButton} onPress={handleAddContact}>
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

export default SOSScreen;

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
    paddingBottom: 110,
  },
  header: {
    marginBottom: 26,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E1E1E',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5D6B63',
    lineHeight: 24,
    marginTop: 4,
  },
  sosButtonContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sosButton: {
    width: 250,
    height: 120,
    backgroundColor: '#E42C24',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#E42C24',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  sosButtonDisabled: {
    opacity: 0.75,
  },
  sirenCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  sosButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  alertBox: {
    alignItems: 'center',
    marginBottom: 28,
  },
  alertIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(244, 173, 170, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B5E5D',
    textAlign: 'center',
    lineHeight: 18,
  },
  contactsSection: {
    width: '100%',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1E1E',
    lineHeight: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  contactCard: {
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  avatarBoxGreen: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#C9E2D1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarBoxRed: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#F4ADAA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#5D6B63',
    lineHeight: 16,
    marginBottom: 2,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1E1E',
    lineHeight: 22,
    marginBottom: 2,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneIcon: {
    marginRight: 4,
  },
  phoneText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#5D6B63',
  },
  callButtonGreen: {
    backgroundColor: '#C9E2D1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  callTextGreen: {
    fontSize: 12,
    fontWeight: '600',
    color: '#77B28C',
    marginLeft: 4,
  },
  callButtonRed: {
    backgroundColor: '#F4ADAA',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  callTextRed: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E42C24',
    marginLeft: 4,
  },
  callIcon: {
    marginRight: 2,
  },
  deleteButton: {
    paddingLeft: 8,
    paddingVertical: 6,
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
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1E1E',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5D6B63',
    marginBottom: 4,
    marginTop: 8,
  },
  inputField: {
    backgroundColor: '#F9FAFA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1E1E1E',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
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