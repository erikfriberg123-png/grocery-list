import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

export default function GuestView() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { t } = useTranslation();
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-lg">{t('guest.viewing_list')}</Text>
    </View>
  );
}
