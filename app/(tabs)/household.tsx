import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { useAuth } from '@/src/features/auth/use-auth';
import { SUPPORTED_LANGUAGES, useLanguage, type LangCode } from '@/src/features/language/use-language';

export default function HouseholdScreen() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { currentLanguage, setLanguage } = useLanguage();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 24 }}>
        <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 36, color: Colors.greenDark, lineHeight: 40 }}>
          {t('settings.title')}
        </Text>
        {user && (
          <Text style={{ fontSize: 14, color: Colors.muted, marginTop: 4 }}>{user.email}</Text>
        )}
      </View>

      {/* Language selector */}
      <View style={{ marginHorizontal: 24, marginBottom: 24 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
          {t('settings.language')}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {SUPPORTED_LANGUAGES.map(({ code, label }) => {
            const active = currentLanguage === code;
            return (
              <Pressable
                key={code}
                onPress={() => setLanguage(code as LangCode)}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: active ? 2 : 1,
                  borderColor: active ? Colors.green : Colors.border,
                  backgroundColor: active ? `${Colors.green}12` : (pressed ? Colors.greenLight : Colors.creamCard),
                  alignItems: 'center',
                  gap: 4,
                })}>
                <Text style={{ fontSize: 13, fontWeight: active ? '700' : '500', color: active ? Colors.green : Colors.text }}>
                  {label}
                </Text>
                {active && (
                  <Ionicons name="checkmark-circle" size={14} color={Colors.green} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Sign out */}
      <View style={{ marginHorizontal: 24 }}>
        <Pressable
          onPress={signOut}
          style={({ pressed }) => ({
            backgroundColor: pressed ? '#f5f1e8' : Colors.creamCard,
            borderWidth: 1,
            borderColor: Colors.border,
            borderRadius: 14,
            paddingVertical: 14,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          })}>
          <Ionicons name="log-out-outline" size={18} color="#c0392b" />
          <Text style={{ fontSize: 15, fontWeight: '500', color: '#c0392b' }}>
            {t('settings.sign_out')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
