import { useEffect } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSocialAuth } from '@/src/features/auth/use-social-auth';

type Props = {
  onError?: (msg: string) => void;
};

export function SocialAuthButtons({ onError }: Props) {
  const { t } = useTranslation();
  const { handleApple, loading, error, appleAvailable } = useSocialAuth();

  useEffect(() => {
    if (error && onError) onError(error);
  }, [error]);

  if (!appleAvailable) return null;

  return (
    <View style={{ gap: 10 }}>
      {/* Divider */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: '#e5e7eb' }} />
        <Text style={{ fontSize: 12, color: '#9ca3af' }}>{t('auth.or')}</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: '#e5e7eb' }} />
      </View>

      {/* Apple — iOS only */}
      {appleAvailable && (
        <Pressable
          onPress={handleApple}
          disabled={loading !== null}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            backgroundColor: pressed ? '#1a1a1a' : '#000000',
            borderRadius: 14,
            paddingVertical: 14,
            opacity: loading !== null ? 0.7 : 1,
          })}>
          {loading === 'apple' ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Ionicons name="logo-apple" size={18} color="#ffffff" />
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#ffffff' }}>
                {t('auth.continue_apple')}
              </Text>
            </>
          )}
        </Pressable>
      )}
    </View>
  );
}
