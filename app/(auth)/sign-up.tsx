import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

export default function SignUp() {
  const { t } = useTranslation();
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-semibold">{t('auth.sign_up')}</Text>
    </View>
  );
}
