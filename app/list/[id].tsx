import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SectionList,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Colors, categoryColor } from '@/constants/colors';
import { useList } from '@/src/features/lists/use-lists';
import {
  useAddItems,
  useClearChecked,
  useDeleteItem,
  useItems,
  useToggleItem,
} from '@/src/features/items/use-items';

type Item = {
  id: string;
  list_id: string;
  name: string;
  normalized_name: string | null;
  category: string | null;
  quantity: number | null;
  unit: string | null;
  note: string | null;
  status: string;
  sort_order: number;
};

function ItemRow({ item, onToggle, onDelete }: {
  item: Item;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const checked = item.status === 'checked';
  return (
    <Pressable
      style={({ pressed }) => ({
        backgroundColor: Colors.creamCard,
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 14,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: 'transparent',
        opacity: checked ? 0.5 : (pressed ? 0.85 : 1),
      })}
      onPress={onToggle}
      onLongPress={onDelete}>
      {/* Checkbox */}
      <View style={{
        width: 24, height: 24, borderRadius: 12,
        borderWidth: 2,
        borderColor: checked ? Colors.green : '#d4cfc1',
        backgroundColor: checked ? Colors.green : 'transparent',
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {checked && <Ionicons name="checkmark" size={14} color="white" />}
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.text, textDecorationLine: checked ? 'line-through' : 'none' }}>
            {item.name}
          </Text>
          {(item.quantity || item.unit) && (
            <Text style={{ fontSize: 13, color: Colors.muted }}>
              {[item.quantity, item.unit].filter(Boolean).join(' ')}
            </Text>
          )}
        </View>
      </View>

      <Text style={{ color: '#c4bfb1', fontSize: 18, paddingHorizontal: 4 }}>⋮</Text>
    </Pressable>
  );
}

function CategoryHeader({ category, total, checked }: { category: string; total: number; checked: number }) {
  const { t } = useTranslation();
  const color = categoryColor(category);
  const label = category ? t(`category.${category}`, { defaultValue: category }) : t('category.other');

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
        <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.text, letterSpacing: 1, textTransform: 'uppercase' }}>
          {label}
        </Text>
      </View>
      <Text style={{ fontSize: 12, color: Colors.muted, fontWeight: '500' }}>{checked}/{total}</Text>
    </View>
  );
}

export default function ListDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { data: list } = useList(id);
  const { data: items, isLoading } = useItems(id);
  const addItems = useAddItems();
  const toggleItem = useToggleItem();
  const deleteItem = useDeleteItem();
  const clearChecked = useClearChecked();

  const [input, setInput] = useState('');
  const [addError, setAddError] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleAdd = async () => {
    const text = input.trim();
    if (!text) return;
    setAddError('');
    try {
      await addItems.mutateAsync({ listId: id, raw: text });
      setInput('');
      inputRef.current?.focus();
    } catch (e: unknown) {
      setAddError(e instanceof Error ? e.message : String(e));
    }
  };

  // Group active items by category
  const active = items?.filter((i) => i.status === 'active') ?? [];
  const checked = items?.filter((i) => i.status === 'checked') ?? [];
  const total = items?.length ?? 0;
  const checkedCount = checked.length;

  const categoryGroups = active.reduce<Record<string, Item[]>>((acc, item) => {
    const key = item.category ?? 'other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const sections = [
    ...Object.entries(categoryGroups).map(([category, data]) => ({ category, data })),
    ...(checked.length > 0 ? [{ category: '__checked__', data: checked }] : []),
  ];

  const progressPct = total === 0 ? 0 : Math.round((checkedCount / total) * 100);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.cream }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}>

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingTop: 52, paddingBottom: 4 }}>
        <Pressable
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8 }}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/')}>

          <Ionicons name="chevron-back" size={22} color={Colors.green} />
          <Text style={{ color: Colors.green, fontSize: 16, fontWeight: '500' }}>Listor</Text>
        </Pressable>
        <Pressable style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.creamCard, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
          <Ionicons name="share-outline" size={18} color={Colors.greenDark} />
        </Pressable>
      </View>

      <SectionList
        ListHeaderComponent={
          <View>
            {/* Title */}
            <View style={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: 16 }}>
              <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 32, color: Colors.greenDark }}>
                {list?.name ?? ''}
              </Text>
              <Text style={{ fontSize: 13, color: Colors.muted, marginTop: 4 }}>
                {total - checkedCount} {t('list.empty').includes('inga') ? 'kvar' : 'remaining'}
              </Text>
            </View>

            {/* Add item bar */}
            <View style={{ flexDirection: 'row', gap: 8, marginHorizontal: 16, marginBottom: 12 }}>
              <TextInput
                ref={inputRef}
                style={{ flex: 1, backgroundColor: Colors.creamCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.text }}
                placeholder={`+ ${t('list.add_item')}…`}
                placeholderTextColor={Colors.muted}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={handleAdd}
                returnKeyType="done"
                blurOnSubmit={false}
              />
              <Pressable
                style={{ backgroundColor: Colors.green, borderRadius: 14, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' }}
                onPress={handleAdd}
                disabled={addItems.isPending}>
                {addItems.isPending
                  ? <ActivityIndicator color="white" size="small" />
                  : <Text style={{ color: 'white', fontWeight: '600', fontSize: 15 }}>Lägg till</Text>}
              </Pressable>
            </View>
            {addError ? (
              <Text style={{ color: '#c0392b', fontSize: 13, marginHorizontal: 16, marginBottom: 8 }}>{addError}</Text>
            ) : null}

            {/* Quick actions */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 16 }}>
              {[
                { icon: 'camera-outline' as const, label: 'Importera bild', onPress: () => router.push('/import/image') },
                { icon: 'link-outline' as const, label: 'Klistra in recept', onPress: () => router.push('/import/recipe') },
                { icon: 'trash-outline' as const, label: 'Rensa köpta', onPress: () => clearChecked.mutate(id) },
              ].map(({ icon, label, onPress }) => (
                <Pressable
                  key={label}
                  style={({ pressed }) => ({ backgroundColor: pressed ? '#f5f1e8' : Colors.creamCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6 })}
                  onPress={onPress}>
                  <Ionicons name={icon} size={14} color={Colors.greenDark} />
                  <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.greenDark }} numberOfLines={1}>{label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Progress */}
            {total > 0 && (
              <View style={{ marginHorizontal: 24, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 12, color: Colors.muted, fontWeight: '500' }}>
                    {checkedCount} av {total} varor klara
                  </Text>
                  <Text style={{ fontSize: 12, color: Colors.muted, fontWeight: '500' }}>{progressPct}%</Text>
                </View>
                <View style={{ height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' }}>
                  <View style={{ height: 4, backgroundColor: Colors.green, borderRadius: 2, width: `${progressPct}%` }} />
                </View>
              </View>
            )}
          </View>
        }
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => {
          if (section.category === '__checked__') {
            return (
              <View style={{ paddingHorizontal: 24, paddingVertical: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.muted, letterSpacing: 1, textTransform: 'uppercase' }}>
                  {t('list.checked_items')}
                </Text>
              </View>
            );
          }
          const sectionChecked = section.data.filter((i) => i.status === 'checked').length;
          return (
            <CategoryHeader
              category={section.category}
              total={section.data.length}
              checked={sectionChecked}
            />
          );
        }}
        renderItem={({ item }) => (
          <ItemRow
            item={item}
            onToggle={() =>
              toggleItem.mutate({
                id: item.id,
                listId: id,
                status: item.status === 'active' ? 'checked' : 'active',
              })
            }
            onDelete={() => deleteItem.mutate({ id: item.id, listId: id })}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: `${Colors.green}14`, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Ionicons name="basket-outline" size={36} color={Colors.green} />
              </View>
              <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 22, color: Colors.greenDark, marginBottom: 8 }}>
                Listan är tom
              </Text>
              <Text style={{ fontSize: 14, color: Colors.muted }}>{t('list.add_item')} ovan</Text>
            </View>
          ) : <ActivityIndicator color={Colors.green} style={{ marginTop: 40 }} />
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </KeyboardAvoidingView>
  );
}
