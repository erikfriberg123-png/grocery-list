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
});

type FormData = z.infer<typeof schema>;

export default function SignIn() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      setServerError(null);
      await signIn(data.email, data.password);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : t('common.error'));
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View className="flex-1 justify-center px-6">
        <Text className="mb-8 text-3xl font-bold text-gray-900">
          {t('auth.sign_in')}
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
            <View className="mb-6">
              <Text className="mb-1 text-sm font-medium text-gray-700">
                {t('auth.password')}
              </Text>
              <TextInput
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900"
                autoComplete="current-password"
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

        <Pressable
          className="items-center rounded-xl bg-blue-600 py-4 active:opacity-80"
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-base font-semibold text-white">{t('auth.sign_in')}</Text>
          )}
        </Pressable>

        <View className="mt-6 flex-row justify-center gap-1">
          <Text className="text-sm text-gray-500">{t('auth.no_account')}</Text>
          <Link href="/(auth)/sign-up">
            <Text className="text-sm font-semibold text-blue-600">{t('auth.sign_up')}</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
