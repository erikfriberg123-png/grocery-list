import AsyncStorage from '@react-native-async-storage/async-storage';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { z } from 'zod';

import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/src/features/auth/store';
import { supabase } from '@/src/lib/supabase';

const { width } = Dimensions.get('window');

const INFO_SLIDES = [
  {
    icon: 'leaf' as const,
    titleKey: 'onboarding.slide1_title',
    subtitleKey: 'onboarding.slide1_subtitle',
    iconColor: 'white',
    iconBg: Colors.green,
  },
  {
    icon: 'checkbox-outline' as const,
    titleKey: 'onboarding.slide2_title',
    subtitleKey: 'onboarding.slide2_subtitle',
    iconColor: Colors.green,
    iconBg: Colors.greenLight,
  },
  {
    icon: 'camera-outline' as const,
    titleKey: 'onboarding.slide3_title',
    subtitleKey: 'onboarding.slide3_subtitle',
    iconColor: Colors.green,
    iconBg: Colors.greenLight,
  },
];

const TOTAL_DOTS = INFO_SLIDES.length + 1;

async function completeOnboarding() {
  await AsyncStorage.setItem('onboarding_complete', 'true');
  useAuthStore.getState().setOnboardingDone(true);
  // AuthGate reacts to onboardingDone change and routes to /(tabs)
}

// ─── Shared input style ───────────────────────────────────────────────────────

const inputStyle = {
  backgroundColor: Colors.creamCard,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 14,
  paddingHorizontal: 16,
  paddingVertical: 14,
  fontSize: 16,
  color: Colors.text,
} as const;

// ─── Auth step ────────────────────────────────────────────────────────────────

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
type SignInData = z.infer<typeof signInSchema>;

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
type SignUpData = z.infer<typeof signUpSchema>;

function AuthStep({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [serverError, setServerError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const signInForm = useForm<SignInData>({ resolver: zodResolver(signInSchema) });
  const signUpForm = useForm<SignUpData>({ resolver: zodResolver(signUpSchema) });

  const switchTab = (next: 'signin' | 'signup') => {
    setTab(next);
    setServerError('');
  };

  const handleSignIn = signInForm.handleSubmit(async (data) => {
    try {
      setServerError('');
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) throw error;
      await completeOnboarding();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : t('common.error'));
    }
  });

  const handleSignUp = signUpForm.handleSubmit(async (data) => {
    try {
      setServerError('');
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });
      if (error) throw error;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await completeOnboarding();
      } else {
        setEmailSent(true);
      }
    } catch (e) {
      setServerError(e instanceof Error ? e.message : t('common.error'));
    }
  });

  if (emailSent) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
        <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.greenLight, alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
          <Ionicons name="mail-outline" size={40} color={Colors.green} />
        </View>
        <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 30, color: Colors.greenDark, textAlign: 'center', marginBottom: 14 }}>
          {t('auth.confirm_email_title')}
        </Text>
        <Text style={{ fontSize: 15, color: Colors.muted, textAlign: 'center', lineHeight: 23 }}>
          {t('auth.confirm_email_body')}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.cream }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingTop: 60, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Back */}
        <Pressable
          onPress={onBack}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 40 }}>
          <Ionicons name="chevron-back" size={20} color={Colors.muted} />
          <Text style={{ color: Colors.muted, fontSize: 14 }}>{t('common.back')}</Text>
        </Pressable>

        {/* App logo */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 36 }}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.green, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="leaf" size={22} color="white" />
          </View>
          <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 28, color: Colors.greenDark }}>
            Lista
          </Text>
        </View>

        {/* Heading */}
        <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 34, color: Colors.greenDark, marginBottom: 6 }}>
          {tab === 'signin' ? t('auth.welcome_back') : t('auth.create_account')}
        </Text>

        {/* Tab toggle */}
        <View style={{ flexDirection: 'row', gap: 4, marginBottom: 30 }}>
          <Text style={{ fontSize: 15, color: Colors.muted }}>
            {tab === 'signin' ? t('auth.no_account') : t('auth.have_account')}
          </Text>
          <Pressable onPress={() => switchTab(tab === 'signin' ? 'signup' : 'signin')}>
            <Text style={{ fontSize: 15, color: Colors.green, fontWeight: '600' }}>
              {tab === 'signin' ? t('auth.sign_up') : t('auth.sign_in')}
            </Text>
          </Pressable>
        </View>

        {/* Server error */}
        {serverError ? (
          <View style={{ backgroundColor: '#fef2f2', borderRadius: 12, padding: 12, marginBottom: 16 }}>
            <Text style={{ color: '#b91c1c', fontSize: 13 }}>{serverError}</Text>
          </View>
        ) : null}

        {tab === 'signin' ? (
          <>
            <Controller
              control={signInForm.control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={{ marginBottom: 14 }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>
                    {t('auth.email')}
                  </Text>
                  <TextInput
                    style={inputStyle}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder={t('auth.email_placeholder')}
                    placeholderTextColor={Colors.muted}
                  />
                  {signInForm.formState.errors.email && (
                    <Text style={{ color: '#b91c1c', fontSize: 12, marginTop: 4 }}>
                      {signInForm.formState.errors.email.message}
                    </Text>
                  )}
                </View>
              )}
            />
            <Controller
              control={signInForm.control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={{ marginBottom: 28 }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>
                    {t('auth.password')}
                  </Text>
                  <TextInput
                    style={inputStyle}
                    autoComplete="current-password"
                    secureTextEntry
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder={t('auth.password_placeholder')}
                    placeholderTextColor={Colors.muted}
                  />
                  {signInForm.formState.errors.password && (
                    <Text style={{ color: '#b91c1c', fontSize: 12, marginTop: 4 }}>
                      {signInForm.formState.errors.password.message}
                    </Text>
                  )}
                </View>
              )}
            />
            <Pressable
              style={({ pressed }) => ({
                backgroundColor: Colors.green,
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: 'center',
                opacity: pressed ? 0.85 : 1,
              })}
              onPress={handleSignIn}
              disabled={signInForm.formState.isSubmitting}>
              {signInForm.formState.isSubmitting
                ? <ActivityIndicator color="white" />
                : <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>{t('auth.sign_in')}</Text>}
            </Pressable>
          </>
        ) : (
          <>
            <Controller
              control={signUpForm.control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={{ marginBottom: 14 }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>
                    {t('auth.email')}
                  </Text>
                  <TextInput
                    style={inputStyle}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder={t('auth.email_placeholder')}
                    placeholderTextColor={Colors.muted}
                  />
                  {signUpForm.formState.errors.email && (
                    <Text style={{ color: '#b91c1c', fontSize: 12, marginTop: 4 }}>
                      {signUpForm.formState.errors.email.message}
                    </Text>
                  )}
                </View>
              )}
            />
            <Controller
              control={signUpForm.control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={{ marginBottom: 28 }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 6 }}>
                    {t('auth.password')}
                  </Text>
                  <TextInput
                    style={inputStyle}
                    autoComplete="new-password"
                    secureTextEntry
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder={t('auth.password_placeholder')}
                    placeholderTextColor={Colors.muted}
                  />
                  {signUpForm.formState.errors.password && (
                    <Text style={{ color: '#b91c1c', fontSize: 12, marginTop: 4 }}>
                      {signUpForm.formState.errors.password.message}
                    </Text>
                  )}
                </View>
              )}
            />
            <Pressable
              style={({ pressed }) => ({
                backgroundColor: Colors.green,
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: 'center',
                opacity: pressed ? 0.85 : 1,
              })}
              onPress={handleSignUp}
              disabled={signUpForm.formState.isSubmitting}>
              {signUpForm.formState.isSubmitting
                ? <ActivityIndicator color="white" />
                : <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>{t('auth.sign_up')}</Text>}
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Dots ─────────────────────────────────────────────────────────────────────

function Dots({ activeIndex }: { activeIndex: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {Array.from({ length: TOTAL_DOTS }).map((_, i) => (
        <View
          key={i}
          style={{
            height: 8,
            width: i === activeIndex ? 24 : 8,
            borderRadius: 4,
            backgroundColor: i === activeIndex ? Colors.green : Colors.border,
          }}
        />
      ))}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const scrollRef = useRef<ScrollView>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [showAuth, setShowAuth] = useState(false);

  const isLastSlide = slideIndex === INFO_SLIDES.length - 1;

  const goToAuth = () => setShowAuth(true);
  const goBack = () => setShowAuth(false);

  const handleSkip = async () => {
    if (session) {
      await completeOnboarding();
    } else {
      goToAuth();
    }
  };

  const handleNext = () => {
    if (isLastSlide) {
      goToAuth();
    } else {
      const next = slideIndex + 1;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setSlideIndex(next);
    }
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setSlideIndex(index);
  };

  if (showAuth) {
    return <AuthStep onBack={goBack} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream }}>
      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}>
        {INFO_SLIDES.map((slide, i) => (
          <View
            key={i}
            style={{
              width,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 40,
              paddingBottom: 180,
            }}>
            <View
              style={{
                width: 108,
                height: 108,
                borderRadius: 54,
                backgroundColor: slide.iconBg,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 44,
                shadowColor: Colors.green,
                shadowOpacity: 0.15,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 8 },
                elevation: 4,
              }}>
              <Ionicons name={slide.icon} size={48} color={slide.iconColor} />
            </View>
            <Text
              style={{
                fontFamily: 'CormorantGaramond_500Medium',
                fontSize: 34,
                color: Colors.greenDark,
                textAlign: 'center',
                marginBottom: 16,
                lineHeight: 42,
              }}>
              {t(slide.titleKey)}
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: Colors.muted,
                textAlign: 'center',
                lineHeight: 25,
              }}>
              {t(slide.subtitleKey)}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Bottom bar */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 24,
          paddingBottom: 48,
          paddingTop: 20,
          backgroundColor: Colors.cream,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          alignItems: 'center',
          gap: 18,
        }}>
        <Dots activeIndex={slideIndex} />

        <Pressable
          style={({ pressed }) => ({
            backgroundColor: Colors.green,
            borderRadius: 16,
            paddingVertical: 18,
            alignItems: 'center',
            alignSelf: 'stretch',
            opacity: pressed ? 0.85 : 1,
          })}
          onPress={handleNext}>
          <Text style={{ color: 'white', fontSize: 17, fontWeight: '600' }}>
            {isLastSlide ? t('onboarding.get_started') : t('onboarding.next')}
          </Text>
        </Pressable>

        <Pressable onPress={handleSkip} hitSlop={12}>
          <Text style={{ color: Colors.muted, fontSize: 14 }}>
            {t('onboarding.skip')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
