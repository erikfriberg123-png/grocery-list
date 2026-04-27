import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/colors';

export default function PlanScreen() {
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 28, color: Colors.greenDark }}>
        {t('nav.plan')}
      </Text>
      <Text style={{ fontSize: 14, color: Colors.muted, marginTop: 8 }}>{t('common.coming_soon')}</Text>
    </View>
  );
}
