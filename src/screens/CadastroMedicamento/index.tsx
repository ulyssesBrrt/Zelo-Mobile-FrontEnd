import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { CadastroMedicamentoScreenNavigationProp } from '../../types/navigation';
import { medicationService } from '../../services/medicationService';

const FORMATOS = [
  'Cápsula',
  'Comprimido',
  'Gotas',
  'Líquido',
  'Pomada',
  'Injetável',
  'Outro',
];

const VIAS = [
  'Oral',
  'Sublingual',
  'Tópica',
  'Inalatória',
  'Oftálmica',
  'Injetável',
  'Outra',
];

export const CadastroMedicamentoScreen: React.FC = () => {
  const navigation = useNavigation<CadastroMedicamentoScreenNavigationProp>();

  // Estados dos campos do formulário
  const [nome, setNome] = useState<string>('');
  const [dosagem, setDosagem] = useState<string>('');
  const [formato, setFormato] = useState<string>('');
  const [viaAdministracao, setViaAdministracao] = useState<string>('');
  const [horario, setHorario] = useState<string>('');
  const [estoque, setEstoque] = useState<string>('');

  // Estados de controle e feedback
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Modais de seleção (Formato e Via)
  const [isFormatoModalVisible, setIsFormatoModalVisible] = useState<boolean>(false);
  const [isViaModalVisible, setIsViaModalVisible] = useState<boolean>(false);

  const handleVoltar = () => {
    navigation.goBack();
  };

  // Máscara automática de horário (HH:MM) ao digitar apenas números
  const handleHorarioChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}`;
    }
    setHorario(formatted);
  };

  // Tratamento do campo estoque (somente números)
  const handleEstoqueChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    setEstoque(numericText);
  };

  // Validação e persistência do medicamento
  const handleSalvar = async () => {
    if (isSubmitting) return;

    if (!nome.trim()) {
      Alert.alert('Campo obrigatório', 'Por favor, informe o nome do medicamento.');
      return;
    }
    if (!dosagem.trim()) {
      Alert.alert('Campo obrigatório', 'Por favor, informe a dosagem do medicamento.');
      return;
    }
    if (!formato.trim()) {
      Alert.alert('Campo obrigatório', 'Por favor, selecione o formato do medicamento.');
      return;
    }
    if (!viaAdministracao.trim()) {
      Alert.alert('Campo obrigatório', 'Por favor, selecione a via de administração.');
      return;
    }
    if (!horario.trim()) {
      Alert.alert('Campo obrigatório', 'Por favor, informe o horário do medicamento.');
      return;
    }

    // Validação estrita do formato de horário HH:MM (00:00 - 23:59)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(horario.trim())) {
      Alert.alert('Horário inválido', 'Por favor, informe um horário válido no formato HH:MM (ex: 07:45).');
      return;
    }

    if (!estoque.trim()) {
      Alert.alert('Campo obrigatório', 'Por favor, informe a quantidade em estoque.');
      return;
    }

    const estoqueNum = parseInt(estoque, 10);
    if (isNaN(estoqueNum) || estoqueNum < 0) {
      Alert.alert('Estoque inválido', 'A quantidade em estoque deve ser um número inteiro não negativo.');
      return;
    }

    // Formatação final garantida (ex: 7:45 -> 07:45)
    const parts = horario.trim().split(':');
    const formattedHorario = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;

    setIsSubmitting(true);

    try {
      const response = await medicationService.addMedication({
        nome: nome.trim(),
        dosagem: dosagem.trim(),
        formato: formato.trim(),
        viaAdministracao: viaAdministracao.trim(),
        horario: formattedHorario,
        estoque: estoqueNum,
      });

      if (response.success) {
        navigation.goBack();
      } else {
        Alert.alert('Erro', 'Não foi possível salvar o medicamento. Tente novamente.');
      }
    } catch {
      Alert.alert('Erro', 'Ocorreu um erro ao salvar o medicamento. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Botão Voltar */}
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={handleVoltar}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Feather name="arrow-left" size={20} color="#1E1E1E" />
          </TouchableOpacity>

          {/* Título */}
          <View style={styles.header}>
            <Text style={styles.title}>Adicionar medicamentos</Text>
            <Text style={styles.subtitle}>Cadastre um novo medicamento.</Text>
          </View>

          {/* Card Principal */}
          <View style={styles.cardContainer}>
            {/* Campo 1: Nome */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Nome</Text>
              <View style={styles.inputBox}>
                <MaterialCommunityIcons
                  name="pill"
                  size={20}
                  color="#5D6B63"
                  style={styles.fieldIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex.: Losartana"
                  placeholderTextColor="#5D6B63"
                  value={nome}
                  onChangeText={setNome}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Campo 2: Dosagem */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Dosagem</Text>
              <View style={styles.inputBox}>
                <MaterialCommunityIcons
                  name="ruler"
                  size={19}
                  color="#5D6B63"
                  style={styles.fieldIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex.: 50mg"
                  placeholderTextColor="#5D6B63"
                  value={dosagem}
                  onChangeText={setDosagem}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Campo 3: Formato */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Formato</Text>
              <TouchableOpacity
                style={styles.inputBox}
                activeOpacity={0.75}
                onPress={() => setIsFormatoModalVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Selecione o formato"
              >
                <Feather
                  name="slash"
                  size={18}
                  color="#5D6B63"
                  style={styles.fieldIcon}
                />
                <Text
                  style={[
                    styles.selectorText,
                    !formato && styles.placeholderText,
                  ]}
                  numberOfLines={1}
                >
                  {formato || 'Selecione o formato'}
                </Text>
                <Feather
                  name="chevron-down"
                  size={16}
                  color="#5D6B63"
                  style={styles.chevronIcon}
                />
              </TouchableOpacity>
            </View>

            {/* Campo 4: Via de Administração */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Via de administração</Text>
              <TouchableOpacity
                style={styles.inputBox}
                activeOpacity={0.75}
                onPress={() => setIsViaModalVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Selecione a via"
              >
                <Feather
                  name="droplet"
                  size={18}
                  color="#5D6B63"
                  style={styles.fieldIcon}
                />
                <Text
                  style={[
                    styles.selectorText,
                    !viaAdministracao && styles.placeholderText,
                  ]}
                  numberOfLines={1}
                >
                  {viaAdministracao || 'Selecione a via'}
                </Text>
                <Feather
                  name="chevron-down"
                  size={16}
                  color="#5D6B63"
                  style={styles.chevronIcon}
                />
              </TouchableOpacity>
            </View>

            {/* Campo 5: Horário */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Horário</Text>
              <View style={styles.inputBox}>
                <Feather
                  name="clock"
                  size={18}
                  color="#5D6B63"
                  style={styles.fieldIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex.: 07:45"
                  placeholderTextColor="#5D6B63"
                  value={horario}
                  onChangeText={handleHorarioChange}
                  keyboardType="number-pad"
                  maxLength={5}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Campo 6: Quantidade em Estoque */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Quantidade em estoque</Text>
              <View style={styles.inputBox}>
                <Feather
                  name="package"
                  size={18}
                  color="#5D6B63"
                  style={styles.fieldIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex.: 24"
                  placeholderTextColor="#5D6B63"
                  value={estoque}
                  onChangeText={handleEstoqueChange}
                  keyboardType="numeric"
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* Botão Salvar */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                isSubmitting && styles.saveButtonDisabled,
              ]}
              activeOpacity={0.85}
              onPress={handleSalvar}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Salvar medicamento"
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.saveButtonText}>Salvar medicamento</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal Formato */}
      <Modal
        visible={isFormatoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFormatoModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsFormatoModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Selecione o formato</Text>
            <FlatList
              data={FORMATOS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    formato === item && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setFormato(item);
                    setIsFormatoModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      formato === item && styles.modalOptionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {formato === item && (
                    <Feather name="check" size={18} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal Via de Administração */}
      <Modal
        visible={isViaModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsViaModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsViaModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Selecione a via de administração</Text>
            <FlatList
              data={VIAS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    viaAdministracao === item && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setViaAdministracao(item);
                    setIsViaModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      viaAdministracao === item && styles.modalOptionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {viaAdministracao === item && (
                    <Feather name="check" size={18} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  backButton: {
    width: 50,
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  header: {
    marginBottom: 20,
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
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E1E1E',
    marginBottom: 6,
    lineHeight: 16,
  },
  inputBox: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.8,
    borderColor: '#E8ECEB',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  fieldIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 13,
    fontWeight: '500',
    color: '#1E1E1E',
  },
  selectorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#1E1E1E',
  },
  placeholderText: {
    color: '#5D6B63',
  },
  chevronIcon: {
    marginLeft: 8,
  },
  saveButton: {
    height: 50,
    backgroundColor: '#3FA66B',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '60%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1E1E',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalOptionSelected: {
    backgroundColor: '#E8F5EE',
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E1E1E',
  },
  modalOptionTextSelected: {
    color: '#3FA66B',
    fontWeight: '700',
  },
});