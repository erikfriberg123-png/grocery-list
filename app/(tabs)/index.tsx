import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { useAuth } from '@/src/features/auth/use-auth';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="mb-2 text-2xl font-bold text-gray-900">{t('list.title')}</Text>
      {user && (
        <Text className="mb-8 text-sm text-gray-400">{user.email}</Text>
      )}
      <Pressable
        className="rounded-xl border border-gray-200 px-6 py-3 active:opacity-70"
        onPress={signOut}>
        <Text className="text-sm font-medium text-gray-600">{t('auth.sign_out')}</Text>
      </Pressable>
    </View>
  );
}
