import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Switch, Text, View } from 'react-native';

import { useThemeColors, useThemeStore } from '@/src/features/theme/use-theme';
import { useAuth } from '@/src/features/auth/use-auth';
import { useAuthStore } from '@/src/features/auth/store';
import { SUPPORTED_LANGUAGES, useLanguage, type LangCode } from '@/src/features/language/use-language';

export default function HouseholdScreen() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const setOnboardingDone = useAuthStore((s) => s.setOnboardingDone);

  const resetOnboarding = async () => {
    await AsyncStorage.removeItem('onboarding_complete');
    setOnboardingDone(false);
    router.replace('/onboarding');
  };
  const { currentLanguage, setLanguage } = useLanguage();
  const colors = useThemeColors();
  const { mode, toggle } = useThemeStore();
  const isDark = mode === 'dark';

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 24 }}>
        <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 36, color: colors.greenDark, lineHeight: 40 }}>
          {t('settings.title')}
        </Text>
        {user && (
          <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>{user.email}</Text>
        )}
      </View>

      {/* Language selector */}
      <View style={{ marginHorizontal: 24, marginBottom: 28 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
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
                  borderColor: active ? colors.green : colors.border,
                  backgroundColor: active ? `${colors.green}18` : (pressed ? colors.greenLight : colors.creamCard),
                  alignItems: 'center',
                  gap: 4,
                })}>
                <Text style={{ fontSize: 13, fontWeight: active ? '700' : '500', color: active ? colors.green : colors.text }}>
                  {label}
                </Text>
                {active && (
                  <Ionicons name="checkmark-circle" size={14} color={colors.green} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Appearance */}
      <View style={{ marginHorizontal: 24, marginBottom: 28 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
          {t('settings.appearance')}
        </Text>
        <View style={{
          backgroundColor: colors.creamCard,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          paddingVertical: 4,
        }}>
          <Pressable
            onPress={toggle}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 14,
              gap: 12,
              backgroundColor: pressed ? colors.pressedBg : 'transparent',
              borderRadius: 13,
            })}>
            {/* Icon pair */}
            <View style={{
              width: 36, height: 36, borderRadius: 10,
              backgroundColor: isDark ? colors.greenLight : `${colors.green}14`,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons
                name={isDark ? 'moon' : 'sunny'}
                size={18}
                color={isDark ? colors.greenDark : colors.green}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>
                {t('settings.dark_mode')}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 1 }}>
                {isDark ? '🌙' : '☀️'} {isDark ? (currentLanguage === 'sv' ? 'Mörkt' : 'Dark') : (currentLanguage === 'sv' ? 'Ljust' : 'Light')}
              </Text>
            </View>

            <Switch
              value={isDark}
              onValueChange={toggle}
              trackColor={{ false: colors.border, true: colors.green }}
              thumbColor={isDark ? colors.greenDark : '#ffffff'}
              ios_backgroundColor={colors.border}
            />
          </Pressable>
        </View>
      </View>

      {/* Onboarding */}
      <View style={{ marginHorizontal: 24, marginBottom: 28 }}>
        <Pressable
          onPress={resetOnboarding}
          style={({ pressed }) => ({
            backgroundColor: pressed ? colors.greenLight : colors.creamCard,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 14,
            paddingVertical: 14,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          })}>
          <Ionicons name="play-circle-outline" size={18} color={colors.green} />
          <Text style={{ fontSize: 15, fontWeight: '500', color: colors.text }}>
            {t('settings.show_onboarding')}
          </Text>
        </Pressable>
      </View>

      {/* Sign out */}
      <View style={{ marginHorizontal: 24 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
          {t('settings.sign_out')}
        </Text>
        <Pressable
          onPress={signOut}
          style={({ pressed }) => ({
            backgroundColor: pressed ? colors.dangerBg : colors.creamCard,
            borderWidth: 1,
            borderColor: pressed ? colors.dangerBorder : colors.border,
            borderRadius: 14,
            paddingVertical: 14,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          })}>
          <Ionicons name="log-out-outline" size={18} color={colors.dangerText} />
          <Text style={{ fontSize: 15, fontWeight: '500', color: colors.dangerText }}>
            {t('settings.sign_out')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
