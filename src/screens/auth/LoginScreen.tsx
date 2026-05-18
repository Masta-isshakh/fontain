import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthFlowError, useAuth } from '../../context/AuthContext';
import { AppButton, AppInput } from '../../components';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../theme';

interface Props {
  navigation: any;
}

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    if (!email.trim()) {
      setEmailError('L\'adresse email est requise');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Adresse email invalide');
      valid = false;
    }
    if (!password) {
      setPasswordError('Le mot de passe est requis');
      valid = false;
    }
    return valid;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setSubmitError('');
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      const parentNav = navigation.getParent?.();
      if (parentNav?.canGoBack?.()) {
        parentNav.goBack();
      }
    } catch (err: any) {
      const msg = err?.message ?? 'Une erreur est survenue. Veuillez réessayer.';

      if ((err as AuthFlowError)?.code === 'RESET_PASSWORD') {
        navigation.navigate('ForgotPassword', {
          email: email.trim().toLowerCase(),
          autoRequest: true,
          reason: 'reset-password-required',
        });
        return;
      }

      if ((err as AuthFlowError)?.code === 'NEW_PASSWORD_REQUIRED') {
        navigation.navigate('ForgotPassword', {
          email: email.trim().toLowerCase(),
          autoRequest: true,
          reason: 'new-password-required',
        });
        return;
      }

      if ((err as AuthFlowError)?.code === 'CONFIRM_SIGN_UP') {
        navigation.navigate('Register');
      }

      setSubmitError(msg);
      Alert.alert('Erreur de connexion', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="water" size={40} color={Colors.white} />
          </View>
          <Text style={styles.appName}>Fontain</Text>
          <Text style={styles.tagline}>Votre espace freelance professionnel</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Connexion</Text>
          <Text style={styles.cardSubtitle}>
            Connectez-vous pour accéder à votre espace
          </Text>

          <View style={styles.form}>
            <AppInput
              label="Adresse email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon="mail-outline"
              error={emailError}
              placeholder="exemple@email.com"
              required
            />
            <AppInput
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon="lock-closed-outline"
              error={passwordError}
              placeholder="Votre mot de passe"
              required
            />

            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotLink}
            >
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            {submitError ? (
              <Text style={styles.submitError}>{submitError}</Text>
            ) : null}

            <AppButton
              title="Se connecter"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              size="lg"
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Pas encore de compte ?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerLink}>Créer un compte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing[5],
    gap: Spacing[5],
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing[8],
    gap: Spacing[2],
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[2],
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  appName: {
    fontSize: FontSize['4xl'],
    fontWeight: FontWeight.extrabold,
    color: Colors.text,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[6],
    gap: Spacing[1],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing[1],
  },
  cardSubtitle: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    marginBottom: Spacing[4],
  },
  form: { gap: Spacing[4] },
  forgotLink: { alignSelf: 'flex-end' },
  forgotText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  submitError: {
    fontSize: FontSize.sm,
    color: Colors.danger,
    fontWeight: FontWeight.medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: Spacing[4],
  },
  footerText: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
  },
  footerLink: {
    fontSize: FontSize.base,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
});
