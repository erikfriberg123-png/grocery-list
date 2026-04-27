import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Colors, categoryColor } from '@/constants/colors';
import { useAddParsedItems } from '@/src/features/items/use-items';
import { parseItem } from '@/src/lib/parse-item';
import { supabase } from '@/src/lib/supabase';
import type { ParsedItem } from '@/src/lib/parse-item';

type Step = 'pick' | 'analyzing' | 'review' | 'importing';
type ImportTab = 'image' | 'recipe';
type ReviewItem = ParsedItem & { selected: boolean; key: string };

async function analyzeImage(base64: string, mimeType: string): Promise<ParsedItem[]> {
  const { data, error } = await supabase.functions.invoke('analyze-shopping-image', {
    body: { imageBase64: base64, mimeType },
  });
  if (error) throw error;
  return (data?.items ?? []) as ParsedItem[];
}

function parseRecipeText(text: string): ParsedItem[] {
  return text
    .split(/[\n,]+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 1)
    .map((line) => parseItem(line));
}

export default function ImportScreen() {
  const { t } = useTranslation();
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const addItems = useAddParsedItems();

  const [tab, setTab]             = useState<ImportTab>('image');
  const [step, setStep]           = useState<Step>('pick');
  const [recipeText, setRecipeText] = useState('');
  const [items, setItems]         = useState<ReviewItem[]>([]);
  const [error, setError]         = useState('');

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
    if (!asset.base64) { setError(t('import.ai_error')); return; }

    setStep('analyzing');
    try {
      const parsed = await analyzeImage(asset.base64, asset.mimeType ?? 'image/jpeg');
      if (parsed.length === 0) { setError(t('import.no_items_found')); setStep('pick'); return; }
      setItems(parsed.map((item, i) => ({ ...item, selected: true, key: `${i}-${item.name}` })));
      setStep('review');
    } catch {
      setError(t('import.ai_error'));
      setStep('pick');
    }
  };

  const parseRecipe = () => {
    const parsed = parseRecipeText(recipeText);
    if (parsed.length === 0) { setError(t('import.no_items_found')); return; }
    setItems(parsed.map((item, i) => ({ ...item, selected: true, key: `${i}-${item.name}` })));
    setStep('review');
  };

  const toggleItem = (key: string) =>
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, selected: !it.selected } : it)));

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
          <Pressable onPress={() => toggleAll(!allSelected)} style={{ padding: 8 }}>
            <Text style={{ color: Colors.green, fontSize: 14, fontWeight: '600' }}>
              {allSelected ? t('import.deselect_all') : t('import.select_all')}
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}>
          {items.map((item) => (
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
              <View style={{
                width: 24, height: 24, borderRadius: 12,
                borderWidth: 2,
                borderColor: item.selected ? Colors.green : '#d4cfc1',
                backgroundColor: item.selected ? Colors.green : 'transparent',
                alignItems: 'center', justifyContent: 'center',
              }}>
                {item.selected && <Ionicons name="checkmark" size={14} color="white" />}
              </View>
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
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: categoryColor(item.category) }} />
            </Pressable>
          ))}
        </ScrollView>

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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.cream }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 8 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8 }}>
          <Ionicons name="chevron-back" size={22} color={Colors.green} />
          <Text style={{ color: Colors.green, fontSize: 16 }}>{t('list.back')}</Text>
        </Pressable>
        <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 20, color: Colors.greenDark, marginLeft: 4 }}>
          {t('import.title')}
        </Text>
      </View>

      {/* Tab selector */}
      <View style={{ flexDirection: 'row', marginHorizontal: 16, marginBottom: 20, backgroundColor: Colors.creamCard, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: Colors.border }}>
        {(['image', 'recipe'] as ImportTab[]).map((tabKey) => (
          <Pressable
            key={tabKey}
            onPress={() => { setTab(tabKey); setError(''); }}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 11,
              alignItems: 'center',
              backgroundColor: tab === tabKey ? Colors.green : 'transparent',
            }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: tab === tabKey ? 'white' : Colors.muted }}>
              {tabKey === 'image' ? t('import.from_image') : t('import.paste_recipe')}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Error banner */}
      {error ? (
        <View style={{ backgroundColor: '#fef2f2', borderRadius: 12, padding: 12, marginHorizontal: 16, marginBottom: 12 }}>
          <Text style={{ color: '#b91c1c', fontSize: 13, textAlign: 'center' }}>{error}</Text>
        </View>
      ) : null}

      {/* Image tab */}
      {tab === 'image' && (
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 28, gap: 32 }}>
          <View style={{ alignItems: 'center', gap: 10 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.greenLight, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="camera-outline" size={36} color={Colors.green} />
            </View>
            <Text style={{ fontSize: 14, color: Colors.muted, textAlign: 'center', lineHeight: 21 }}>
              {t('import.image_hint')}
            </Text>
          </View>
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
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>{t('import.take_photo')}</Text>
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
              <Text style={{ color: Colors.greenDark, fontSize: 16, fontWeight: '600' }}>{t('import.choose_library')}</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Recipe tab */}
      {tab === 'recipe' && (
        <View style={{ flex: 1, paddingHorizontal: 16, gap: 16 }}>
          <View style={{ alignItems: 'center', gap: 8 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.greenLight, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="document-text-outline" size={36} color={Colors.green} />
            </View>
            <Text style={{ fontSize: 14, color: Colors.muted, textAlign: 'center', lineHeight: 21 }}>
              {t('import.recipe_hint')}
            </Text>
          </View>
          <TextInput
            style={{
              flex: 1,
              maxHeight: 240,
              backgroundColor: Colors.creamCard,
              borderWidth: 1,
              borderColor: Colors.border,
              borderRadius: 16,
              padding: 16,
              fontSize: 15,
              color: Colors.text,
              textAlignVertical: 'top',
            }}
            placeholder={t('import.recipe_placeholder')}
            placeholderTextColor={Colors.muted}
            multiline
            value={recipeText}
            onChangeText={setRecipeText}
          />
          <Pressable
            style={({ pressed }) => ({
              backgroundColor: recipeText.trim() ? Colors.green : Colors.border,
              borderRadius: 16,
              paddingVertical: 18,
              alignItems: 'center',
              opacity: pressed ? 0.85 : 1,
              marginBottom: 32,
            })}
            onPress={parseRecipe}
            disabled={!recipeText.trim()}>
            <Text style={{ color: recipeText.trim() ? 'white' : Colors.muted, fontSize: 16, fontWeight: '600' }}>
              {t('import.find_items')}
            </Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
