import React, { forwardRef, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

export interface InputProps extends TextInputProps {
  iconName?: keyof typeof Feather.glyphMap;
  isPassword?: boolean;
  error?: string;
  isPasswordVisible?: boolean;
  onTogglePasswordVisibility?: () => void;
  wrapperStyle?: StyleProp<ViewStyle>;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      iconName,
      isPassword = false,
      error,
      isPasswordVisible = false,
      onTogglePasswordVisibility,
      wrapperStyle,
      onFocus,
      onBlur,
      style,
      ...rest
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);

    const handleFocus = (e: any) => {
      setFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: any) => {
      setFocused(false);
      onBlur?.(e);
    };

    const borderColor = error
      ? COLORS.error
      : focused
      ? COLORS.borderFocus
      : COLORS.border;

    return (
      <View style={[styles.wrapper, wrapperStyle]}>
        <View style={[styles.container, { borderColor }]}>
          {iconName && (
            <View style={styles.leftIconContainer}>
              <Feather
                name={iconName}
                size={20}
                color={focused ? COLORS.primary : COLORS.textMuted}
              />
            </View>
          )}

          <TextInput
            ref={ref}
            style={[styles.input, style]}
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry={isPassword && !isPasswordVisible}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...rest}
          />

          {isPassword && onTogglePasswordVisibility && (
            <TouchableOpacity
              style={styles.rightIconButton}
              onPress={onTogglePasswordVisibility}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={
                isPasswordVisible ? 'Ocultar senha' : 'Exibir senha'
              }
            >
              <Feather
                name={isPasswordVisible ? 'eye' : 'eye-off'}
                size={20}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 16,
  },
  container: {
    width: '100%',
    height: 50,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  leftIconContainer: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  rightIconButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
