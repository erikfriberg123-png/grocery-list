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
  Text,
  TextInput,
  View,
} from 'react-native';
import { z } from 'zod';

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

export default function SignUp() {
  const { t } = useTranslation();
  const { signUp } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      setServerError(null);
      await signUp(data.email, data.password);
      setEmailSent(true);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : t('common.error'));
    }
  };

  if (emailSent) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="mb-2 text-2xl font-bold text-gray-900">Check your email</Text>
        <Text className="text-center text-base text-gray-500">
          We sent a confirmation link. Open it to activate your account.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View className="flex-1 justify-center px-6">
        <Text className="mb-8 text-3xl font-bold text-gray-900">
          {t('auth.sign_up')}
        </Text>

        {serverError && (
          <View className="mb-4 rounded-lg bg-red-50 p-3">
            <Text className="text-sm text-red-600">{serverError}</Text>
          </View>
        )}

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="mb-4">
              <Text className="mb-1 text-sm font-medium text-gray-700">
                {t('auth.email')}
              </Text>
              <TextInput
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
              {errors.email && (
                <Text className="mt-1 text-xs text-red-500">{errors.email.message}</Text>
              )}
            </View>
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="mb-4">
              <Text className="mb-1 text-sm font-medium text-gray-700">
                {t('auth.password')}
              </Text>
              <TextInput
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900"
                autoComplete="new-password"
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
              {errors.password && (
                <Text className="mt-1 text-xs text-red-500">{errors.password.message}</Text>
              )}
            </View>
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="mb-6">
              <Text className="mb-1 text-sm font-medium text-gray-700">
                Confirm password
              </Text>
              <TextInput
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900"
                autoComplete="new-password"
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
              {errors.confirmPassword && (
                <Text className="mt-1 text-xs text-red-500">
                  {errors.confirmPassword.message}
                </Text>
              )}
            </View>
          )}
        />

        <Pressable
          className="items-center rounded-xl bg-blue-600 py-4 active:opacity-80"
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-base font-semibold text-white">{t('auth.sign_up')}</Text>
          )}
        </Pressable>

        <View className="mt-6 flex-row justify-center gap-1">
          <Text className="text-sm text-gray-500">{t('auth.have_account')}</Text>
          <Link href="/(auth)/sign-in">
            <Text className="text-sm font-semibold text-blue-600">{t('auth.sign_in')}</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
