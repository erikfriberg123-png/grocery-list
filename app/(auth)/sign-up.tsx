import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { z } from 'zod';

import { Colors } from '@/constants/colors';
import { useAuth } from '@/src/features/auth/use-auth';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
type FormData = z.infer<typeof schema>;

const inputStyle = {
  backgroundColor: Colors.creamCard,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 14,
  paddingHorizontal: 16,
  paddingVertical: 14,
  fontSize: 16,
  color: Colors.text,
} as const;

export default function SignUp() {
  const { t } = useTranslation();
  const { signUp } = useAuth();
  const [serverError, setServerError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setServerError('');
      await signUp(data.email, data.password);
      setEmailSent(true);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : t('common.error'));
    }
  };

  if (emailSent) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
        <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.greenLight, alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
          <Ionicons name="mail-outline" size={40} color={Colors.green} />
        </View>
        <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 30, color: Colors.greenDark, textAlign: 'center', marginBottom: 14 }}>
          {t('auth.confirm_email_title')}
        </Text>
        <Text style={{ fontSize: 15, color: Colors.muted, textAlign: 'center', lineHeight: 23 }}>
          {t('auth.confirm_email_body')}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.cream }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Logo */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 48 }}>
          <View style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: Colors.green,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: Colors.green,
            shadowOpacity: 0.25,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
          }}>
            <Ionicons name="leaf" size={24} color="white" />
          </View>
          <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 30, color: Colors.greenDark }}>
            Lista
          </Text>
        </View>

        {/* Heading */}
        <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 36, color: Colors.greenDark, marginBottom: 6 }}>
          {t('auth.create_account')}
        </Text>
        <View style={{ flexDirection: 'row', gap: 4, marginBottom: 36 }}>
          <Text style={{ fontSize: 15, color: Colors.muted }}>{t('auth.have_account')}</Text>
          <Link href="/(auth)/sign-in">
            <Text style={{ fontSize: 15, color: Colors.green, fontWeight: '600' }}>{t('auth.sign_in')}</Text>
          </Link>
        </View>

        {/* Server error */}
        {serverError ? (
          <View style={{ backgroundColor: '#fef2f2', borderRadius: 12, padding: 12, marginBottom: 16 }}>
            <Text style={{ color: '#b91c1c', fontSize: 13 }}>{serverError}</Text>
          </View>
        ) : null}

        {/* Email */}
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>
                {t('auth.email')}
              </Text>
              <TextInput
                style={inputStyle}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="you@example.com"
                placeholderTextColor={Colors.muted}
              />
              {errors.email && (
                <Text style={{ color: '#b91c1c', fontSize: 12, marginTop: 4 }}>
                  {errors.email.message}
                </Text>
              )}
            </View>
          )}
        />

        {/* Password */}
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>
                {t('auth.password')}
              </Text>
              <TextInput
                style={inputStyle}
                autoComplete="new-password"
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="••••••••"
                placeholderTextColor={Colors.muted}
              />
              {errors.password && (
                <Text style={{ color: '#b91c1c', fontSize: 12, marginTop: 4 }}>
                  {errors.password.message}
                </Text>
              )}
            </View>
          )}
        />

        {/* Confirm password */}
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={{ marginBottom: 32 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>
                {t('auth.confirm_password')}
              </Text>
              <TextInput
                style={inputStyle}
                autoComplete="new-password"
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="••••••••"
                placeholderTextColor={Colors.muted}
              />
              {errors.confirmPassword && (
                <Text style={{ color: '#b91c1c', fontSize: 12, marginTop: 4 }}>
                  {errors.confirmPassword.message}
                </Text>
              )}
            </View>
          )}
        />

        {/* Submit */}
        <Pressable
          style={({ pressed }) => ({
            backgroundColor: Colors.green,
            borderRadius: 14,
            paddingVertical: 17,
            alignItems: 'center',
            opacity: pressed ? 0.85 : 1,
            shadowColor: Colors.green,
            shadowOpacity: 0.2,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 3,
          })}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}>
          {isSubmitting
            ? <ActivityIndicator color="white" />
            : <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>{t('auth.sign_up')}</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
