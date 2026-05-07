import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { z } from 'zod';

import { Colors } from '@/constants/colors';
import { useAuth } from '@/src/features/auth/use-auth';

const schema = z.object({
  email: z.string().email(),
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

export default function ForgotPassword() {
  const { t } = useTranslation();
  const { resetPassword } = useAuth();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState('');

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setServerError('');
      await resetPassword(data.email);
      setSent(true);
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
          {t('auth.forgot_password_title')}
        </Text>
        <Text style={{ fontSize: 15, color: Colors.muted, marginBottom: 36 }}>
          {t('auth.forgot_password_hint')}
        </Text>

        {sent ? (
          <View style={{ backgroundColor: '#f0fdf4', borderRadius: 12, padding: 16, marginBottom: 24 }}>
            <Text style={{ color: '#15803d', fontSize: 15 }}>{t('auth.reset_sent')}</Text>
          </View>
        ) : null}

        {serverError ? (
          <View style={{ backgroundColor: '#fef2f2', borderRadius: 12, padding: 12, marginBottom: 16 }}>
            <Text style={{ color: '#b91c1c', fontSize: 13 }}>{serverError}</Text>
          </View>
        ) : null}

        {!sent && (
          <>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={{ marginBottom: 24 }}>
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
                : <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>{t('auth.send_reset_link')}</Text>}
            </Pressable>
          </>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
          <Link href="/(auth)/sign-in">
            <Text style={{ fontSize: 15, color: Colors.green, fontWeight: '600' }}>{t('auth.back_to_sign_in')}</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
