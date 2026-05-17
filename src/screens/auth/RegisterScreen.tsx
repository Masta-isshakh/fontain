import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signUp, confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';
import { AppButton, AppInput } from '../../components';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useLoading } from '../../context/LoadingContext';

interface Props {
  navigation: any;
}

  const [submitError, setSubmitError] = useState('');
export function RegisterScreen({ navigation }: Props) {
  const { withLoading } = useLoading();
  const { login } = useAuth();
  const [step, setStep] = useState<'form' | 'verify'>('form');

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Verify step
  const [code, setCode] = useState('');
    setSubmitError('');

  const [errors, setErrors] = useState<Record<string, string>>({});
        const normalizedEmail = email.toLowerCase().trim();

        const signUpWithFullName = () =>
          signUp({
            username: normalizedEmail,
            password,
            options: {
              userAttributes: {
                email: normalizedEmail,
                fullname: fullName.trim(),
              },
            },
          });

        const signUpWithName = () =>
          signUp({
            username: normalizedEmail,
            password,
            options: {
              userAttributes: {
                email: normalizedEmail,
                name: fullName.trim(),
              },
            },
          });

        let result;
        try {
          result = await signUpWithFullName();
        } catch (signUpErr: any) {
          const fallbackMessage = String(signUpErr?.message ?? '');
          const shouldRetryWithoutFullName =
            fallbackMessage.toLowerCase().includes('fullname') ||
            fallbackMessage.toLowerCase().includes('userattributes') ||
            fallbackMessage.toLowerCase().includes('invalidparameterexception');

          if (!shouldRetryWithoutFullName) {
            throw signUpErr;
          }

          result = await signUpWithName();
        }

  const handleRegister = async () => {
    if (!validate()) return;
    await withLoading(async () => {
      try {
        const result = await signUp({
          username: email.toLowerCase().trim(),
          password,
          options: {
        setSubmitError(details);
            userAttributes: {
              email: email.toLowerCase().trim(),
              fullname: fullName.trim(),
            },
          },
        });

        if (result.isSignUpComplete) {
          await login(email.toLowerCase().trim(), password);
          return;
        }

        if (result.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
          setStep('verify');
          return;
    setSubmitError('');
        }

        Alert.alert(
          'Verification requise',
          'Veuillez terminer la verification de votre compte puis vous connecter.'
        );
      } catch (err: any) {
        const msg = err?.message ?? 'Erreur lors de l\'inscription';
        setSubmitError(err?.message ?? 'Le code est incorrect ou a expiré');
        const details = err?.name ? `${err.name}: ${msg}` : msg;
        if (msg.includes('already exists') || msg.includes('UsernameExistsException')) {
          Alert.alert('Compte existant', 'Un compte avec cet email existe déjà. Veuillez vous connecter.');
        } else {
          Alert.alert('Erreur', details);
        }
      }
    }, 'Création du compte...');
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      Alert.alert('Erreur', 'Saisissez le code de vérification');
      return;
    }

    await withLoading(async () => {
      try {
        await confirmSignUp({
          username: email.toLowerCase().trim(),
          confirmationCode: code.trim(),
        });
        await login(email.toLowerCase().trim(), password);
      } catch (err: any) {
        Alert.alert('Code invalide', err?.message ?? 'Le code est incorrect ou a expiré');
      }
    }, 'Vérification...');
  };

  const handleResend = async () => {
    await withLoading(async () => {
      try {
        await resendSignUpCode({ username: email.toLowerCase().trim() });
        Alert.alert('Code envoyé', 'Un nouveau code a été envoyé à votre adresse email.');
      } catch (err: any) {
        Alert.alert('Erreur', err?.message ?? 'Impossible d\'envoyer le code');
      }
    }, 'Envoi...');
  };

  if (step === 'verify') {
    return (

          {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Icon */}
          <View style={styles.iconWrap}>
            <Ionicons name="mail-open-outline" size={48} color={Colors.primary} />
          </View>

          <Text style={styles.title}>Vérifiez votre email</Text>
          <Text style={styles.subtitle}>
            Un code de vérification a été envoyé à{' '}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>

          <AppInput
            label="Code de vérification"
            value={code}
            onChangeText={setCode}
            placeholder="123456"
            keyboardType="number-pad"
            leftIcon="key-outline"
          />

          <AppButton
            title="Vérifier mon compte"
            onPress={handleVerify}
            variant="primary"
            fullWidth
          />

          <TouchableOpacity style={styles.resendRow} onPress={handleResend}>
            <Text style={styles.resendText}>Vous n'avez pas reçu le code?</Text>
            <Text style={styles.resendLink}> Renvoyer</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backRow} onPress={() => setStep('form')}>
            <Ionicons name="arrow-back" size={16} color={Colors.textSecondary} />
            <Text style={styles.backText}>Modifier l'email</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <Ionicons name="water" size={36} color={Colors.primary} />
          </View>
          <Text style={styles.brand}>Fontain</Text>
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Rejoignez la communauté des freelancers Fontain</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <AppInput
            label="Nom complet"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Jean Dupont"
            leftIcon="person-outline"
            error={errors.fullName}
            autoCapitalize="words"
          />
          <AppInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="jean@example.com"
            leftIcon="mail-outline"
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <AppInput
            label="Mot de passe"
            value={password}

        {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}
            onChangeText={setPassword}
            placeholder="8 caractères minimum"
            leftIcon="lock-closed-outline"
            error={errors.password}
            secureTextEntry
          />
          <AppInput
            label="Confirmer le mot de passe"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Répétez le mot de passe"
            leftIcon="lock-closed-outline"
            error={errors.confirmPassword}
            secureTextEntry
          />
        </View>

        <AppButton
          title="Créer mon compte"
          onPress={handleRegister}
          variant="primary"
          fullWidth
          size="lg"
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Vous avez déjà un compte?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: {
    flexGrow: 1,
    padding: Spacing[6],
    gap: Spacing[5],
    paddingBottom: Spacing[10],
  },
  header: { alignItems: 'center', gap: Spacing[2] },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[1],
  },
  brand: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.extrabold,
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: FontSize['2xl'],
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
  emailHighlight: {
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  form: { gap: Spacing[4] },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  footerText: { fontSize: FontSize.base, color: Colors.textSecondary },
  footerLink: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  submitError: {
    color: Colors.danger,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    textAlign: 'left',
  },
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  resendLink: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
  },
  backText: { fontSize: FontSize.sm, color: Colors.textSecondary },
});
