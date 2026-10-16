import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacityProps,
} from 'react-native';
import { COLORS } from '../../constants/theme';

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  isLoading = false,
  disabled,
  style,
  onPress,
  ...rest
}) => {
  const isButtonDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isButtonDisabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={isButtonDisabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={COLORS.white} />
      ) : (
        <Text style={styles.title}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  title: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
