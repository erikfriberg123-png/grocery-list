import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
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
import { z } from 'zod';

import { Colors } from '@/constants/colors';
import { useAuth } from '@/src/features/auth/use-auth';

const schema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
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

export default function ResetPassword() {
  const { t } = useTranslation();
  const { updatePassword } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState('');

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setServerError('');
      await updatePassword(data.password);
      router.replace('/(tabs)');
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

        <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 36, color: Colors.greenDark, marginBottom: 6 }}>
          {t('auth.new_password_title')}
        </Text>
        <Text style={{ fontSize: 15, color: Colors.muted, marginBottom: 36 }}>
          {t('auth.new_password_hint')}
        </Text>

        {serverError ? (
          <View style={{ backgroundColor: '#fef2f2', borderRadius: 12, padding: 12, marginBottom: 16 }}>
            <Text style={{ color: '#b91c1c', fontSize: 13 }}>{serverError}</Text>
          </View>
        ) : null}

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>
                {t('auth.new_password')}
              </Text>
              <TextInput
                style={inputStyle}
                autoComplete="new-password"
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
                placeholder={t('auth.password_placeholder')}
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
            : <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>{t('auth.save_password')}</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
