import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { Colors, categoryColor } from '@/constants/colors';
import { useAddParsedItems } from '@/src/features/items/use-items';
import { supabase } from '@/src/lib/supabase';
import type { ParsedItem } from '@/src/lib/parse-item';

type Step = 'pick' | 'analyzing' | 'review' | 'importing';

type ReviewItem = ParsedItem & { selected: boolean; key: string };

async function analyzeImage(base64: string, mimeType: string): Promise<ParsedItem[]> {
  const { data, error } = await supabase.functions.invoke('analyze-shopping-image', {
    body: { imageBase64: base64, mimeType },
  });
  if (error) throw error;
  return (data?.items ?? []) as ParsedItem[];
}

export default function ImageImportScreen() {
  const { t } = useTranslation();
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const addItems = useAddParsedItems();

  const [step, setStep] = useState<Step>('pick');
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [error, setError] = useState('');

  const pickAndAnalyze = async (source: 'camera' | 'library') => {
    setError('');
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      quality: 0.75,
      base64: true,
      allowsEditing: false,
    };

    let result: ImagePicker.ImagePickerResult;
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Camera access is required to take photos.');
        return;
      }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Photo library access is required.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    if (!asset.base64) {
      setError(t('import.ai_error'));
      return;
    }

    const mimeType = asset.mimeType ?? 'image/jpeg';
    setStep('analyzing');

    try {
      const parsed = await analyzeImage(asset.base64, mimeType);
      if (parsed.length === 0) {
        setError(t('import.no_items_found'));
        setStep('pick');
        return;
      }
      setItems(parsed.map((item, i) => ({ ...item, selected: true, key: `${i}-${item.name}` })));
      setStep('review');
    } catch {
      setError(t('import.ai_error'));
      setStep('pick');
    }
  };

  const toggleItem = (key: string) =>
    setItems((prev) => prev.map((it) => it.key === key ? { ...it, selected: !it.selected } : it));

  const toggleAll = (select: boolean) =>
    setItems((prev) => prev.map((it) => ({ ...it, selected: select })));

  const handleImport = async () => {
    const selected = items.filter((it) => it.selected);
    if (!selected.length || !listId) return;
    setStep('importing');
    try {
      await addItems.mutateAsync({ listId, items: selected });
      router.back();
    } catch {
      setError(t('common.error'));
      setStep('review');
    }
  };

  const selectedCount = items.filter((it) => it.selected).length;

  // ── Analyzing ──────────────────────────────────────────────────────────────
  if (step === 'analyzing') {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <ActivityIndicator size="large" color={Colors.green} />
        <Text style={{ fontSize: 16, color: Colors.muted }}>{t('import.analyzing')}</Text>
      </View>
    );
  }

  // ── Review ─────────────────────────────────────────────────────────────────
  if (step === 'review' || step === 'importing') {
    const allSelected = items.every((it) => it.selected);
    return (
      <View style={{ flex: 1, backgroundColor: Colors.cream }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12 }}>
          <Pressable
            onPress={() => setStep('pick')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8 }}>
            <Ionicons name="chevron-back" size={22} color={Colors.green} />
            <Text style={{ color: Colors.green, fontSize: 16 }}>{t('list.back')}</Text>
          </Pressable>
          <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 20, color: Colors.greenDark }}>
            {t('import.review_title')}
          </Text>
          <Pressable
            onPress={() => toggleAll(!allSelected)}
            style={{ padding: 8 }}>
            <Text style={{ color: Colors.green, fontSize: 14, fontWeight: '600' }}>
              {allSelected ? t('import.deselect_all') : t('import.select_all')}
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}>
          {items.map((item) => {
            const color = categoryColor(item.category);
            return (
              <Pressable
                key={item.key}
                onPress={() => toggleItem(item.key)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: Colors.creamCard,
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 8,
                  gap: 12,
                  borderWidth: 1,
                  borderColor: item.selected ? Colors.green : Colors.border,
                  opacity: pressed ? 0.8 : 1,
                })}>
                {/* Checkbox */}
                <View style={{
                  width: 24, height: 24, borderRadius: 12,
                  borderWidth: 2,
                  borderColor: item.selected ? Colors.green : '#d4cfc1',
                  backgroundColor: item.selected ? Colors.green : 'transparent',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {item.selected && <Ionicons name="checkmark" size={14} color="white" />}
                </View>

                {/* Item info */}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.text }}>
                    {item.name}
                    {(item.quantity || item.unit) ? (
                      <Text style={{ fontSize: 13, fontWeight: '400', color: Colors.muted }}>
                        {'  '}{[item.quantity, item.unit].filter(Boolean).join(' ')}
                      </Text>
                    ) : null}
                  </Text>
                </View>

                {/* Category dot */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Import button */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: 40, backgroundColor: Colors.cream, borderTopWidth: 1, borderTopColor: Colors.border }}>
          <Pressable
            style={({ pressed }) => ({
              backgroundColor: selectedCount > 0 ? Colors.green : Colors.border,
              borderRadius: 16,
              paddingVertical: 17,
              alignItems: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
            onPress={handleImport}
            disabled={selectedCount === 0 || step === 'importing'}>
            {step === 'importing'
              ? <ActivityIndicator color="white" />
              : <Text style={{ color: selectedCount > 0 ? 'white' : Colors.muted, fontSize: 16, fontWeight: '600' }}>
                  {t('import.import_selected', { count: selectedCount })}
                </Text>}
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Pick ───────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8 }}>
          <Ionicons name="chevron-back" size={22} color={Colors.green} />
          <Text style={{ color: Colors.green, fontSize: 16 }}>{t('list.back')}</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 28, gap: 48 }}>
        {/* Title */}
        <View style={{ alignItems: 'center', gap: 12 }}>
          <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.greenLight, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="camera-outline" size={40} color={Colors.green} />
          </View>
          <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 28, color: Colors.greenDark, textAlign: 'center' }}>
            {t('import.image_title')}
          </Text>
          <Text style={{ fontSize: 14, color: Colors.muted, textAlign: 'center', lineHeight: 21 }}>
            Point at a handwritten list, a recipe page, or any photo with grocery items.
          </Text>
        </View>

        {/* Error */}
        {error ? (
          <View style={{ backgroundColor: '#fef2f2', borderRadius: 12, padding: 12 }}>
            <Text style={{ color: '#b91c1c', fontSize: 13, textAlign: 'center' }}>{error}</Text>
          </View>
        ) : null}

        {/* Source buttons */}
        <View style={{ gap: 12 }}>
          <Pressable
            style={({ pressed }) => ({
              backgroundColor: Colors.green,
              borderRadius: 16,
              paddingVertical: 18,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              opacity: pressed ? 0.85 : 1,
            })}
            onPress={() => pickAndAnalyze('camera')}>
            <Ionicons name="camera" size={20} color="white" />
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
              {t('import.take_photo')}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => ({
              backgroundColor: Colors.creamCard,
              borderRadius: 16,
              paddingVertical: 18,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              borderWidth: 1,
              borderColor: Colors.border,
              opacity: pressed ? 0.85 : 1,
            })}
            onPress={() => pickAndAnalyze('library')}>
            <Ionicons name="images-outline" size={20} color={Colors.greenDark} />
            <Text style={{ color: Colors.greenDark, fontSize: 16, fontWeight: '600' }}>
              {t('import.choose_library')}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
