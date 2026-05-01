import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Modal, Pressable, Switch, Text, View } from 'react-native';

import { useThemeColors, useThemeStore } from '@/src/features/theme/use-theme';
import { useAuth } from '@/src/features/auth/use-auth';
import { useAuthStore } from '@/src/features/auth/store';
import { supabase } from '@/src/lib/supabase';
import { SUPPORTED_LANGUAGES, useLanguage, type LangCode } from '@/src/features/language/use-language';

export default function HouseholdScreen() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const setOnboardingDone = useAuthStore((s) => s.setOnboardingDone);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const resetOnboarding = async () => {
    await AsyncStorage.removeItem('onboarding_complete');
    setOnboardingDone(false);
    router.replace('/onboarding');
  };

  const confirmDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
          },
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);

      await supabase.auth.signOut();
      await AsyncStorage.multiRemove(['onboarding_complete', 'app_language', 'pending_invite']);
      setShowDeleteModal(false);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setDeleting(false);
    }
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
      <View style={{ marginHorizontal: 24, marginBottom: 16 }}>
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

      {/* Delete account */}
      <View style={{ marginHorizontal: 24 }}>
        <Pressable
          onPress={() => setShowDeleteModal(true)}
          style={({ pressed }) => ({
            backgroundColor: pressed ? colors.dangerBg : 'transparent',
            borderRadius: 14,
            paddingVertical: 14,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          })}>
          <Ionicons name="trash-outline" size={18} color={colors.dangerText} />
          <Text style={{ fontSize: 15, fontWeight: '500', color: colors.dangerText }}>
            {t('settings.delete_account')}
          </Text>
        </Pressable>
      </View>

      {/* Delete confirmation modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: colors.cream, borderRadius: 20, padding: 28, width: '100%', maxWidth: 360 }}>
            {/* Icon */}
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.dangerBg, alignItems: 'center', justifyContent: 'center', marginBottom: 20, alignSelf: 'center' }}>
              <Ionicons name="warning-outline" size={28} color={colors.dangerText} />
            </View>

            <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 26, color: colors.greenDark, textAlign: 'center', marginBottom: 12 }}>
              {t('settings.delete_account_title')}
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 21, marginBottom: 28 }}>
              {t('settings.delete_account_warning')}
            </Text>

            {deleteError ? (
              <View style={{ backgroundColor: colors.dangerBg, borderRadius: 10, padding: 10, marginBottom: 16 }}>
                <Text style={{ color: colors.dangerText, fontSize: 13, textAlign: 'center' }}>{deleteError}</Text>
              </View>
            ) : null}

            {/* Confirm */}
            <Pressable
              onPress={confirmDeleteAccount}
              disabled={deleting}
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#b91c1c' : '#ef4444',
                borderRadius: 14,
                paddingVertical: 15,
                alignItems: 'center',
                marginBottom: 10,
                opacity: deleting ? 0.7 : 1,
              })}>
              {deleting
                ? <ActivityIndicator color="white" />
                : <Text style={{ color: 'white', fontSize: 15, fontWeight: '700' }}>{t('settings.delete_account_confirm')}</Text>}
            </Pressable>

            {/* Cancel */}
            <Pressable
              onPress={() => { setShowDeleteModal(false); setDeleteError(null); }}
              disabled={deleting}
              style={({ pressed }) => ({
                backgroundColor: pressed ? colors.greenLight : 'transparent',
                borderRadius: 14,
                paddingVertical: 15,
                alignItems: 'center',
              })}>
              <Text style={{ fontSize: 15, fontWeight: '500', color: colors.muted }}>{t('common.cancel')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
