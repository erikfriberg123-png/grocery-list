import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

const { width } = Dimensions.get('window');

type Slide = {
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  subtitleKey: string;
  iconColor: string;
  iconBg: string;
};

const SLIDES: Slide[] = [
  {
    icon: 'leaf',
    titleKey: 'onboarding.slide1_title',
    subtitleKey: 'onboarding.slide1_subtitle',
    iconColor: 'white',
    iconBg: Colors.green,
  },
  {
    icon: 'checkbox-outline',
    titleKey: 'onboarding.slide2_title',
    subtitleKey: 'onboarding.slide2_subtitle',
    iconColor: Colors.green,
    iconBg: Colors.greenLight,
  },
  {
    icon: 'camera-outline',
    titleKey: 'onboarding.slide3_title',
    subtitleKey: 'onboarding.slide3_subtitle',
    iconColor: Colors.green,
    iconBg: Colors.greenLight,
  },
  {
    icon: 'cart-outline',
    titleKey: 'onboarding.slide4_title',
    subtitleKey: 'onboarding.slide4_subtitle',
    iconColor: Colors.green,
    iconBg: Colors.greenLight,
  },
];

async function completeOnboarding() {
  await AsyncStorage.setItem('onboarding_complete', 'true');
  router.replace('/(tabs)');
}

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const isLast = activeIndex === SLIDES.length - 1;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  const handleNext = () => {
    if (isLast) {
      completeOnboarding();
      return;
    }
    scrollRef.current?.scrollTo({ x: (activeIndex + 1) * width, animated: true });
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}>
        {SLIDES.map((slide, i) => (
          <View
            key={i}
            style={{
              width,
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 40,
              paddingBottom: 160,
            }}>
            {/* Icon circle */}
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: slide.iconBg,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 40,
                shadowColor: Colors.green,
                shadowOpacity: 0.15,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 6 },
                elevation: 4,
              }}>
              <Ionicons name={slide.icon} size={44} color={slide.iconColor} />
            </View>

            <Text
              style={{
                fontFamily: 'CormorantGaramond_500Medium',
                fontSize: 34,
                color: Colors.greenDark,
                textAlign: 'center',
                marginBottom: 16,
                lineHeight: 40,
              }}>
              {t(slide.titleKey)}
            </Text>

            <Text
              style={{
                fontSize: 16,
                color: Colors.muted,
                textAlign: 'center',
                lineHeight: 24,
              }}>
              {t(slide.subtitleKey)}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Bottom controls */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 24,
          paddingBottom: 48,
          paddingTop: 16,
          backgroundColor: Colors.cream,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          alignItems: 'center',
          gap: 20,
        }}>
        {/* Dot indicators */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {SLIDES.map((_, i) => (
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

        {/* CTA button */}
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
            {isLast ? t('onboarding.get_started') : t('onboarding.next')}
          </Text>
        </Pressable>

        {/* Skip on non-last slides */}
        {!isLast && (
          <Pressable onPress={completeOnboarding}>
            <Text style={{ color: Colors.muted, fontSize: 14 }}>Skip</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
