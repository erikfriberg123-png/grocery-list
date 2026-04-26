import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

export default function ImageImport() {
  const { t } = useTranslation();
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-semibold">{t('import.image_title')}</Text>
    </View>
  );
}
