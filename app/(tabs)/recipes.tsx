import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useThemeColors } from '@/src/features/theme/use-theme';
import {
  type Recipe,
  type RecipeCategory,
  type RecipeForm,
  recipeImageUrl,
  useDeleteRecipe,
  useRecipes,
  useUpsertRecipe,
} from '@/src/features/recipes/use-recipes';

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: 'meat'       as RecipeCategory, emoji: '🥩', color: '#c47b6b' },
  { key: 'fish'       as RecipeCategory, emoji: '🐟', color: '#6b9bc4' },
  { key: 'salads'     as RecipeCategory, emoji: '🥗', color: '#7ba05b' },
  { key: 'pasta'      as RecipeCategory, emoji: '🍝', color: '#d4a373' },
  { key: 'vegetarian' as RecipeCategory, emoji: '🌱', color: '#5f9e6e' },
  { key: 'soups'      as RecipeCategory, emoji: '🍲', color: '#c49b5e' },
  { key: 'desserts'   as RecipeCategory, emoji: '🍰', color: '#a584c4' },
  { key: 'other'      as RecipeCategory, emoji: '📁', color: '#a8a29e' },
] as const;

const ALL_KEY = '__all__';

// All 8 categories + "All" = 9 tiles → perfect 3×3 grid
const GRID_ITEMS = [
  ...CATEGORIES,
  { key: ALL_KEY, emoji: '📋', color: '#3a5a40' },
] as const;

const EMPTY_FORM: RecipeForm = { name: '', category: 'meat', url: '', note: '', localImageUri: '' };

// ── Helpers ───────────────────────────────────────────────────────────────────

function categoryMeta(key: RecipeCategory) {
  return CATEGORIES.find(c => c.key === key) ?? CATEGORIES[CATEGORIES.length - 1];
}

async function pickFromLibrary(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });
  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

function isLocalUri(uri: string) {
  return uri.startsWith('file://') || uri.startsWith('/var/') ||
         uri.startsWith('content://') || uri.startsWith('ph://');
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RecipeImage({ uri, categoryKey }: { uri: string | null; categoryKey: RecipeCategory }) {
  const [imgError, setImgError] = useState(false);
  const { emoji, color } = categoryMeta(categoryKey);

  if (!uri || imgError) {
    return (
      <View style={{ width: 96, height: 96, borderRadius: 14, backgroundColor: color, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Text style={{ fontSize: 38 }}>{emoji}</Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={{ width: 96, height: 96, borderRadius: 14, flexShrink: 0 }}
      onError={() => setImgError(true)}
    />
  );
}

function RecipeCard({ recipe, onEdit, onDelete }: { recipe: Recipe; onEdit: () => void; onDelete: () => void }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const imageUri = recipeImageUrl(recipe.image_path);

  return (
    <View style={{
      backgroundColor: colors.creamCard,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 10,
    }}>
      <RecipeImage uri={imageUri} categoryKey={recipe.category} />

      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }} numberOfLines={2}>
          {recipe.name}
        </Text>
        {recipe.note ? (
          <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 18 }} numberOfLines={2}>
            {recipe.note}
          </Text>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          {recipe.url ? (
            <Pressable
              onPress={() => Linking.openURL(recipe.url!)}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 4,
                backgroundColor: pressed ? colors.greenLight : colors.green,
                paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
              })}>
              <Ionicons name="open-outline" size={13} color="white" />
              <Text style={{ fontSize: 12, fontWeight: '700', color: 'white' }}>{t('recipe.open')}</Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={onEdit}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: 4,
              backgroundColor: pressed ? colors.pressedBg : colors.creamCard,
              borderWidth: 1, borderColor: colors.border,
              paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
            })}>
            <Ionicons name="pencil-outline" size={13} color={colors.greenDark} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.greenDark }}>{t('recipe.edit')}</Text>
          </Pressable>

          <Pressable
            onPress={onDelete}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: 4,
              backgroundColor: pressed ? colors.dangerBg : colors.creamCard,
              borderWidth: 1, borderColor: pressed ? colors.dangerBorder : colors.border,
              paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10,
            })}>
            <Ionicons name="trash-outline" size={13} color={colors.dangerText} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ── 3×3 Category Grid ─────────────────────────────────────────────────────────

function CategoryGrid({
  recipes,
  activeCategory,
  onSelect,
}: {
  recipes: Recipe[];
  activeCategory: RecipeCategory | null;
  onSelect: (key: RecipeCategory | null) => void;
}) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8, marginBottom: 4 }}>
      {GRID_ITEMS.map(item => {
        const isAll  = item.key === ALL_KEY;
        const catKey = isAll ? null : (item.key as RecipeCategory);
        const active = isAll ? activeCategory === null : activeCategory === catKey;
        const count  = isAll
          ? recipes.length
          : recipes.filter(r => r.category === item.key).length;
        const label  = isAll
          ? t('recipe_category.all')
          : t(`recipe_category.${item.key}`);

        return (
          <Pressable
            key={item.key}
            onPress={() => onSelect(active ? null : catKey)}
            style={({ pressed }) => ({
              width: '31.1%',
              aspectRatio: 1.15,
              borderRadius: 16,
              borderWidth: active ? 0 : 1,
              borderColor: colors.border,
              backgroundColor: active ? item.color : (pressed ? colors.pressedBg : colors.creamCard),
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              shadowColor: active ? item.color : 'transparent',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: active ? 0.3 : 0,
              shadowRadius: 6,
              elevation: active ? 3 : 0,
            })}>
            <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: active ? 'white' : colors.text, textAlign: 'center' }}>
              {label}
            </Text>
            <View style={{
              backgroundColor: active ? 'rgba(255,255,255,0.25)' : colors.border,
              borderRadius: 8, paddingHorizontal: 7, paddingVertical: 1, marginTop: 1,
            }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: active ? 'white' : colors.muted }}>
                {count}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Image picker row ──────────────────────────────────────────────────────────

function ImagePickerRow({ displayUri, onChange }: { displayUri: string | null; onChange: (uri: string) => void }) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  const handlePick = async () => {
    const picked = await pickFromLibrary();
    if (picked) onChange(picked);
  };

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
        {t('recipe.photo')}
      </Text>

      {displayUri ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Image source={{ uri: displayUri }} style={{ width: 72, height: 72, borderRadius: 12 }} />
          <View style={{ gap: 8 }}>
            <Pressable
              onPress={handlePick}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: pressed ? colors.pressedBg : colors.creamCard,
                borderWidth: 1, borderColor: colors.border,
                borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9,
              })}>
              <Ionicons name="image-outline" size={15} color={colors.greenDark} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.greenDark }}>{t('recipe.change_photo')}</Text>
            </Pressable>
            <Pressable
              onPress={() => onChange('')}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: pressed ? colors.dangerBg : 'transparent',
                borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9,
              })}>
              <Ionicons name="trash-outline" size={15} color={colors.dangerText} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.dangerText }}>{t('recipe.remove_photo')}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={handlePick}
          style={({ pressed }) => ({
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
            backgroundColor: pressed ? colors.pressedBg : colors.creamCard,
            borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
            borderRadius: 14, paddingVertical: 20,
          })}>
          <Ionicons name="camera-outline" size={20} color={colors.muted} />
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.muted }}>{t('recipe.upload_photo')}</Text>
        </Pressable>
      )}
    </View>
  );
}

// ── Add / Edit sheet ─────────────────────────────────────────────────────────

function RecipeSheet({
  visible,
  editingRecipe,
  defaultCategory,
  onSave,
  onClose,
}: {
  visible: boolean;
  editingRecipe: Recipe | null;
  defaultCategory: RecipeCategory;
  onSave: (form: RecipeForm, existingImagePath: string | null) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [form, setForm] = useState<RecipeForm>(EMPTY_FORM);

  const set = <K extends keyof RecipeForm>(field: K, value: RecipeForm[K]) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleShow = () => {
    if (editingRecipe) {
      setForm({
        name:          editingRecipe.name,
        category:      editingRecipe.category,
        url:           editingRecipe.url ?? '',
        note:          editingRecipe.note ?? '',
        localImageUri: '',
      });
    } else {
      setForm({ ...EMPTY_FORM, category: defaultCategory });
    }
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave(form, editingRecipe?.image_path ?? null);
    onClose();
  };

  // What to show in the image picker:
  // '__remove__' sentinel means user cleared the image → show nothing
  // local URI → show that directly
  // '' with existing image_path → show public storage URL
  const displayUri: string | null =
    form.localImageUri === '__remove__' ? null :
    form.localImageUri ? form.localImageUri :
    recipeImageUrl(editingRecipe?.image_path ?? null);

  const inputStyle = {
    backgroundColor: colors.creamCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.text,
    marginBottom: 12,
    minHeight: 48,
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onShow={handleShow}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <Pressable style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={onClose}>
          <Pressable style={{ backgroundColor: colors.cream, borderRadius: 24, paddingTop: 12, paddingBottom: 36, maxHeight: '94%' }}>
            <View style={{ width: 36, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
            <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 24, color: colors.greenDark, paddingHorizontal: 24, marginBottom: 20 }}>
              {editingRecipe ? t('recipe.edit_title') : t('recipe.add_title')}
            </Text>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 8 }}
              showsVerticalScrollIndicator={false}>

              {/* Name */}
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
                {t('recipe.name')} *
              </Text>
              <TextInput
                style={inputStyle}
                placeholder={t('recipe.name')}
                placeholderTextColor={colors.muted}
                value={form.name}
                onChangeText={v => set('name', v)}
                autoFocus={!editingRecipe}
                returnKeyType="next"
              />

              {/* Category */}
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
                {t('item.category')}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
                {CATEGORIES.map(cat => {
                  const active = form.category === cat.key;
                  return (
                    <Pressable
                      key={cat.key}
                      onPress={() => set('category', cat.key)}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 6,
                        paddingHorizontal: 14, paddingVertical: 10,
                        borderRadius: 20,
                        borderWidth: active ? 0 : 1, borderColor: colors.border,
                        backgroundColor: active ? cat.color : colors.creamCard,
                      }}>
                      <Text style={{ fontSize: 16 }}>{cat.emoji}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: active ? 'white' : colors.text }}>
                        {t(`recipe_category.${cat.key}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Photo */}
              <ImagePickerRow
                displayUri={displayUri}
                onChange={uri => {
                  if (!uri) {
                    // Sentinel: user cleared the image
                    set('localImageUri', '__remove__');
                  } else {
                    set('localImageUri', uri);
                  }
                }}
              />

              {/* URL */}
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
                {t('recipe.url')}
              </Text>
              <TextInput
                style={inputStyle}
                placeholder="https://…"
                placeholderTextColor={colors.muted}
                value={form.url}
                onChangeText={v => set('url', v)}
                keyboardType="url"
                autoCapitalize="none"
                returnKeyType="next"
              />

              {/* Notes */}
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
                {t('recipe.note')}
              </Text>
              <TextInput
                style={[inputStyle, { minHeight: 80, textAlignVertical: 'top' }]}
                placeholder={t('recipe.note')}
                placeholderTextColor={colors.muted}
                value={form.note}
                onChangeText={v => set('note', v)}
                multiline
                numberOfLines={3}
                returnKeyType="done"
              />

              {/* Save */}
              <Pressable
                onPress={handleSave}
                disabled={!form.name.trim()}
                style={({ pressed }) => ({
                  backgroundColor: form.name.trim()
                    ? (pressed ? colors.greenDark : colors.green)
                    : colors.border,
                  borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4,
                })}>
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>{t('common.save')}</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function RecipesScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();

  const { data: recipes = [], isLoading } = useRecipes();
  const upsertRecipe = useUpsertRecipe();
  const deleteRecipe = useDeleteRecipe();

  const [activeCategory, setActiveCategory] = useState<RecipeCategory | null>(null);
  const [search, setSearch]                 = useState('');
  const [showSheet, setShowSheet]           = useState(false);
  const [editingId, setEditingId]           = useState<string | null>(null);

  const editingRecipe = recipes.find(r => r.id === editingId) ?? null;

  const filtered = recipes.filter(r => {
    const matchesCat    = activeCategory === null || r.category === activeCategory;
    const q             = search.trim().toLowerCase();
    const matchesSearch = !q || r.name.toLowerCase().includes(q) || (r.note ?? '').toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const handleSave = (form: RecipeForm, existingImagePath: string | null) => {
    upsertRecipe.mutate({ id: editingId ?? undefined, form, existingImagePath });
    setEditingId(null);
  };

  const handleDelete = (recipe: Recipe) => {
    Alert.alert(
      recipe.name,
      undefined,
      [
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => deleteRecipe.mutate({ id: recipe.id, imagePath: recipe.image_path }),
        },
        { text: t('common.cancel'), style: 'cancel' },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>

      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 12 }}>
        <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 34, color: colors.greenDark, lineHeight: 38 }}>
          {t('recipe.title')}
        </Text>
        <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4, lineHeight: 18 }}>
          {t('recipe.subtitle')}
        </Text>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 10,
          backgroundColor: colors.creamCard,
          borderWidth: 1, borderColor: colors.border,
          borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11,
        }}>
          <Ionicons name="search-outline" size={16} color={colors.muted} />
          <TextInput
            style={{ flex: 1, fontSize: 15, color: colors.text, minHeight: 22 }}
            placeholder={t('recipe.search')}
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* 3×3 Category grid */}
        <CategoryGrid recipes={recipes} activeCategory={activeCategory} onSelect={setActiveCategory} />

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 16, marginVertical: 16 }} />

        {/* Recipe list */}
        <View style={{ paddingHorizontal: 16 }}>
          {isLoading ? (
            <ActivityIndicator color={colors.green} style={{ marginTop: 32 }} />
          ) : filtered.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 32, gap: 10 }}>
              <Text style={{ fontSize: 40 }}>
                {search ? '🔍' : activeCategory ? categoryMeta(activeCategory).emoji : '🍴'}
              </Text>
              <Text style={{ fontSize: 15, color: colors.muted, textAlign: 'center', maxWidth: 240, lineHeight: 22 }}>
                {search ? t('recipe.no_results') : t('recipe.no_recipes')}
              </Text>
            </View>
          ) : (
            filtered.map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onEdit={() => { setEditingId(recipe.id); setShowSheet(true); }}
                onDelete={() => handleDelete(recipe)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Add button */}
      <View style={{
        position: 'absolute', bottom: 20, left: 16, right: 16,
        shadowColor: '#2d6a4f', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, shadowRadius: 10, elevation: 6,
      }}>
        <Pressable
          onPress={() => { setEditingId(null); setShowSheet(true); }}
          style={({ pressed }) => ({
            backgroundColor: pressed ? colors.greenDark : colors.green,
            borderRadius: 18, paddingVertical: 17,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
          })}>
          <Ionicons name="add-circle-outline" size={20} color="white" />
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 }}>
            {t('recipe.add')}
          </Text>
        </Pressable>
      </View>

      <RecipeSheet
        visible={showSheet}
        editingRecipe={editingRecipe ?? null}
        defaultCategory={activeCategory ?? 'meat'}
        onSave={handleSave}
        onClose={() => { setShowSheet(false); setEditingId(null); }}
      />
    </View>
  );
}
