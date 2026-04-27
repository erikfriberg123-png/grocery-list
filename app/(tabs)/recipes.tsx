import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/colors';

export default function RecipesScreen() {
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 28, color: Colors.greenDark }}>
        {t('nav.recipes')}
      </Text>
      <Text style={{ fontSize: 14, color: Colors.muted, marginTop: 8 }}>{t('common.coming_soon')}</Text>
    </View>
  );
}
