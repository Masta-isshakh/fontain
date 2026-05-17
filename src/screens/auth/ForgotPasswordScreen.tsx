import React, { useEffect, useRef, useState } from 'react';
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
import { useAuth } from '../../context/AuthContext';
import { AppButton, AppInput } from '../../components';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../theme';

interface Props {
  navigation: any;
  route?: {
    params?: {
      email?: string;
      autoRequest?: boolean;
      reason?: 'reset-password-required' | 'new-password-required';
    };
  };
}

export function ForgotPasswordScreen({ navigation, route }: Props) {
  const { forgotPassword, confirmForgotPassword } = useAuth();
  const initialEmail = route?.params?.email?.trim().toLowerCase() ?? '';
  const shouldAutoRequest = route?.params?.autoRequest === true;
  const flowReason = route?.params?.reason;
  const [step, setStep] = useState<'request' | 'confirm'>(shouldAutoRequest ? 'confirm' : 'request');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const hasAutoRequested = useRef(false);

  useEffect(() => {
    if (!shouldAutoRequest || !initialEmail || hasAutoRequested.current) {
      return;
    }

    hasAutoRequested.current = true;
    setLoading(true);

    void forgotPassword(initialEmail)
      .then(() => {
        setStep('confirm');
        Alert.alert(
          'Code envoye',
          'Un code de verification a ete envoye a votre adresse email pour finaliser la reinitialisation du mot de passe.'
        );
      })
      .catch((err: any) => {
        Alert.alert('Erreur', err?.message ?? 'Une erreur est survenue');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [forgotPassword, initialEmail, shouldAutoRequest]);

  const handleRequest = async () => {
    if (!email.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre adresse email');
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      setStep('confirm');
      Alert.alert('Code envoyÃ©', 'Un code de vÃ©rification a Ã©tÃ© envoyÃ© Ã  votre adresse email.');
    } catch (err: any) {
      Alert.alert('Erreur', err?.message ?? 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!code.trim() || !newPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 8 caractÃ¨res');
      return;
    }
    setLoading(true);
    try {
      await confirmForgotPassword(email.trim().toLowerCase(), code.trim(), newPassword);
      Alert.alert(
        'SuccÃ¨s',
        'Votre mot de passe a Ã©tÃ© rÃ©initialisÃ©. Vous pouvez maintenant vous connecter.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (err: any) {
      Alert.alert('Erreur', err?.message ?? 'Code invalide ou expirÃ©');
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
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.iconWrap}>
          <Ionicons name="lock-open" size={36} color={Colors.primary} />
        </View>

        <Text style={styles.title}>
          {step === 'request' ? 'Mot de passe oubliÃ©' : 'RÃ©initialiser'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'request'
            ? 'Entrez votre email pour recevoir un code de vÃ©rification.'
            : flowReason === 'new-password-required'
            ? `Ce compte doit definir un nouveau mot de passe. Entrez le code recu a ${email} puis choisissez votre nouveau mot de passe.`
            : `Entrez le code reÃ§u Ã  ${email} et votre nouveau mot de passe.`}
        </Text>

        {step === 'request' ? (
          <View style={styles.form}>
            <AppInput
              label="Adresse email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
              placeholder="exemple@email.com"
              required
            />
            <AppButton
              title="Envoyer le code"
              onPress={handleRequest}
              loading={loading}
              fullWidth
              size="lg"
            />
          </View>
        ) : (
          <View style={styles.form}>
            <AppInput
              label="Code de vÃ©rification"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              leftIcon="keypad-outline"
              placeholder="000000"
              required
            />
            <AppInput
              label="Nouveau mot de passe"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              leftIcon="lock-closed-outline"
              placeholder="Minimum 8 caractÃ¨res"
              required
            />
            <AppButton
              title="RÃ©initialiser le mot de passe"
              onPress={handleConfirm}
              loading={loading}
              fullWidth
              size="lg"
            />
          </View>
        )}

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backLink}>
          <Text style={styles.backLinkText}>Retour Ã  la connexion</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  content: {
    flexGrow: 1,
    padding: Spacing[5],
    gap: Spacing[4],
  },
  back: { alignSelf: 'flex-start', padding: 4, marginBottom: Spacing[4] },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  form: { gap: Spacing[4], marginTop: Spacing[2] },
  backLink: { alignSelf: 'center', marginTop: Spacing[4] },
  backLinkText: {
    fontSize: FontSize.base,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
});
