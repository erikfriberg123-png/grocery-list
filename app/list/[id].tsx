import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SectionList,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  useAddItems,
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
      className="flex-row items-center gap-3 px-5 py-3 active:bg-gray-50"
      onPress={onToggle}
      onLongPress={onDelete}>
      <View
        className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
          checked ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
        }`}>
        {checked && <Text className="text-xs font-bold text-white">✓</Text>}
      </View>
      <Text
        className={`flex-1 text-base ${
          checked ? 'text-gray-400 line-through' : 'text-gray-900'
        }`}>
        {item.name}
      </Text>
    </Pressable>
  );
}

export default function ListDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { data: items, isLoading } = useItems(id);
  const addItems = useAddItems();
  const toggleItem = useToggleItem();
  const deleteItem = useDeleteItem();

  const [input, setInput] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleAdd = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    await addItems.mutateAsync({ listId: id, raw: text });
    inputRef.current?.focus();
  };

  const active = items?.filter((i) => i.status === 'active') ?? [];
  const checked = items?.filter((i) => i.status === 'checked') ?? [];

  const sections = [
    ...(active.length > 0 ? [{ title: '', data: active }] : []),
    ...(checked.length > 0 ? [{ title: t('list.checked_items'), data: checked }] : []),
  ];

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}>

      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-14">
        <Pressable
          className="h-9 w-9 items-center justify-center rounded-full bg-gray-100 active:opacity-70"
          onPress={() => router.back()}>
          <Text className="text-base text-gray-600">‹</Text>
        </Pressable>
        <Text className="flex-1 text-xl font-bold text-gray-900" numberOfLines={1}>
          {t('list.title')}
        </Text>
      </View>

      {/* Items */}
      {isLoading ? (
        <ActivityIndicator className="mt-10" />
      ) : sections.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-base text-gray-400">{t('list.empty')}</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) =>
            section.title ? (
              <View className="bg-white px-5 pb-1 pt-4">
                <Text className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {section.title}
                </Text>
              </View>
            ) : null
          }
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
        />
      )}

      {/* Fast-add input */}
      <View className="border-t border-gray-100 px-4 py-3">
        <View className="flex-row items-center gap-3 rounded-xl bg-gray-50 px-4">
          <TextInput
            ref={inputRef}
            className="flex-1 py-3 text-base text-gray-900"
            placeholder={t('list.add_item')}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
            blurOnSubmit={false}
          />
          {input.trim().length > 0 && (
            <Pressable onPress={handleAdd} disabled={addItems.isPending}>
              {addItems.isPending ? (
                <ActivityIndicator size="small" />
              ) : (
                <Text className="text-sm font-semibold text-blue-600">{t('common.done')}</Text>
              )}
            </Pressable>
          )}
        </View>
        <Text className="mt-1 px-1 text-xs text-gray-400">
          {t('list.add_item')} · Separate multiple with commas
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
