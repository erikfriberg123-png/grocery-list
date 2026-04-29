import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { z } from 'zod';

import { Colors } from '@/constants/colors';
import { useAuth } from '@/src/features/auth/use-auth';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
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

export default function SignIn() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const [serverError, setServerError] = useState('');

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setServerError('');
      await signIn(data.email, data.password);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : t('common.error'));
    }
  };

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
          <Image source={require('@/assets/images/logo-light.png')} style={{ width: 48, height: 48, borderRadius: 14 }} />
          <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 30, color: Colors.greenDark }}>
            Lista
          </Text>
        </View>

        {/* Heading */}
        <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 36, color: Colors.greenDark, marginBottom: 6 }}>
          {t('auth.welcome_back')}
        </Text>
        <View style={{ flexDirection: 'row', gap: 4, marginBottom: 36 }}>
          <Text style={{ fontSize: 15, color: Colors.muted }}>{t('auth.no_account')}</Text>
          <Link href="/(auth)/sign-up">
            <Text style={{ fontSize: 15, color: Colors.green, fontWeight: '600' }}>{t('auth.sign_up')}</Text>
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
                placeholder={t('auth.email_placeholder')}
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
            <View style={{ marginBottom: 32 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>
                {t('auth.password')}
              </Text>
              <TextInput
                style={inputStyle}
                autoComplete="current-password"
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder={t('auth.password_placeholder')}
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
            : <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>{t('auth.sign_in')}</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
