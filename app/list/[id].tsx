import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from '@/src/components/DraggableList';
import QRCode from 'react-native-qrcode-svg';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Colors, categoryColor } from '@/constants/colors';
import { soundAdd, soundCheck, soundReorder } from '@/src/lib/sounds';
import { useList } from '@/src/features/lists/use-lists';
import {
  useAddItems,
  useClearChecked,
  useDeleteItem,
  useItems,
  useReorderItem,
  useToggleItem,
} from '@/src/features/items/use-items';
import { useShareLink, EXPIRY_OPTIONS } from '@/src/features/sharing/use-share-link';

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

type HeaderRow       = { type: 'header'; category: string; count: number };
type ItemRow         = { type: 'item'; item: Item };
type CheckedHeaderRow = { type: 'checked_header' };
type FlatRow = HeaderRow | ItemRow | CheckedHeaderRow;

const CATEGORY_ORDER = [
  'produce', 'dairy', 'meat', 'frozen', 'bakery', 'pantry', 'drinks', 'snacks', 'hygiene',
];

function ItemCard({ item, onToggle, onDelete, drag, isActive }: {
  item: Item;
  onToggle: () => void;
  onDelete: () => void;
  drag: () => void;
  isActive: boolean;
}) {
  const checked = item.status === 'checked';
  return (
    <Pressable
      style={{
        backgroundColor: Colors.creamCard,
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 14,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: isActive ? Colors.green : 'transparent',
        opacity: checked ? 0.5 : 1,
        elevation: isActive ? 4 : 0,
      }}
      onPress={onToggle}>

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

      {/* Name + quantity */}
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

      {/* Drag handle for active items, delete button for checked */}
      {checked ? (
        <Pressable
          onPress={onDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ padding: 4 }}>
          <Ionicons name="trash-outline" size={16} color={Colors.muted} />
        </Pressable>
      ) : (
        <Pressable
          onLongPress={drag}
          delayLongPress={150}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ padding: 4 }}>
          <Ionicons name="reorder-three-outline" size={22} color="#c4bfb1" />
        </Pressable>
      )}
    </Pressable>
  );
}

function CategoryHeader({ category, count }: { category: string; count: number }) {
  const { t } = useTranslation();
  const color = categoryColor(category);
  const label = t(`category.${category}`, { defaultValue: category });
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
        <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.text, letterSpacing: 1, textTransform: 'uppercase' }}>
          {label}
        </Text>
      </View>
      {count > 0 && (
        <Text style={{ fontSize: 12, color: Colors.muted, fontWeight: '500' }}>{count}</Text>
      )}
    </View>
  );
}

function ShareSheet({ listId, onClose }: { listId: string; onClose: () => void }) {
  const { t } = useTranslation();
  const [selectedDays, setSelectedDays] = useState<number | null>(7);
  const { shareUrl, loading, error, copied, createLink, copyLink } = useShareLink(listId);

  return (
    <Modal visible transparent animationType="slide">
      <Pressable style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={onClose}>
        <Pressable style={{ backgroundColor: Colors.cream, borderRadius: 24, padding: 24, paddingBottom: 40 }}>
          {/* Handle */}
          <View style={{ width: 36, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />

          <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 22, color: Colors.greenDark, marginBottom: 20 }}>
            {t('share.title')}
          </Text>

          {/* Expiry picker */}
          <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
            Giltighetstid
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
            {EXPIRY_OPTIONS.map((opt) => {
              const active = selectedDays === opt.days;
              return (
                <Pressable
                  key={String(opt.days)}
                  onPress={() => setSelectedDays(opt.days)}
                  style={{
                    flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
                    borderWidth: active ? 2 : 1,
                    borderColor: active ? Colors.green : Colors.border,
                    backgroundColor: active ? `${Colors.green}12` : Colors.creamCard,
                  }}>
                  <Text style={{ fontSize: 12, fontWeight: active ? '700' : '500', color: active ? Colors.green : Colors.text }}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Create button */}
          {!shareUrl && (
            <Pressable
              style={{ backgroundColor: Colors.green, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 8 }}
              onPress={() => createLink(selectedDays)}
              disabled={loading}>
              {loading
                ? <ActivityIndicator color="white" />
                : <Text style={{ color: 'white', fontWeight: '600', fontSize: 15 }}>{t('share.title')}</Text>}
            </Pressable>
          )}

          {error && (
            <Text style={{ color: '#c0392b', fontSize: 13, textAlign: 'center', marginBottom: 8 }}>{error}</Text>
          )}

          {/* QR + copy once link exists */}
          {shareUrl && (
            <View style={{ alignItems: 'center', gap: 16 }}>
              <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Colors.border }}>
                <QRCode value={shareUrl} size={180} color={Colors.greenDark} backgroundColor="white" />
              </View>
              <Text style={{ fontSize: 12, color: Colors.muted, textAlign: 'center' }} numberOfLines={2}>{shareUrl}</Text>
              <Pressable
                style={{ backgroundColor: copied ? Colors.greenLight : Colors.green, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                onPress={copyLink}>
                <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color={copied ? Colors.greenDark : 'white'} />
                <Text style={{ color: copied ? Colors.greenDark : 'white', fontWeight: '600', fontSize: 15 }}>
                  {copied ? 'Kopierad!' : t('share.copy_link')}
                </Text>
              </Pressable>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function ListDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { data: list } = useList(id);
  const { data: items, isLoading } = useItems(id);
  const addItems    = useAddItems();
  const toggleItem  = useToggleItem();
  const deleteItem  = useDeleteItem();
  const clearChecked = useClearChecked();
  const reorderItem = useReorderItem();

  const [input, setInput]       = useState('');
  const [addError, setAddError] = useState('');
  const [showShare, setShowShare] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleAdd = async () => {
    const text = input.trim();
    if (!text) return;
    setAddError('');
    try {
      await addItems.mutateAsync({ listId: id, raw: text });
      soundAdd();
      setInput('');
      inputRef.current?.focus();
    } catch (e: unknown) {
      setAddError(e instanceof Error ? e.message : String(e));
    }
  };

  const active      = items?.filter((i) => i.status === 'active') ?? [];
  const checked     = items?.filter((i) => i.status === 'checked') ?? [];
  const total       = items?.length ?? 0;
  const checkedCount = checked.length;
  const progressPct  = total === 0 ? 0 : Math.round((checkedCount / total) * 100);

  // Flatten sections into a single list: headers are non-draggable anchors
  const flatData = useMemo<FlatRow[]>(() => {
    const groups = active.reduce<Record<string, Item[]>>((acc, item) => {
      const key = item.category ?? 'other';
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    const rows: FlatRow[] = [];

    for (const cat of CATEGORY_ORDER) {
      const catItems = groups[cat] ?? [];
      rows.push({ type: 'header', category: cat, count: catItems.length });
      for (const item of catItems) rows.push({ type: 'item', item });
    }

    const otherItems = groups['other'] ?? [];
    if (otherItems.length > 0) {
      rows.push({ type: 'header', category: 'other', count: otherItems.length });
      for (const item of otherItems) rows.push({ type: 'item', item });
    }

    if (checked.length > 0) {
      rows.push({ type: 'checked_header' });
      for (const item of checked) rows.push({ type: 'item', item });
    }

    return rows;
  }, [items]);

  const handleDragEnd = ({ data, from, to }: { data: FlatRow[]; from: number; to: number }) => {
    if (from === to) return;
    soundReorder();

    const movedRow = data[to];
    if (movedRow?.type !== 'item' || movedRow.item.status !== 'active') return;

    // Nearest header above the dropped position = new category
    let newCategory: string | null = null;
    for (let i = to - 1; i >= 0; i--) {
      const row = data[i];
      if (row.type === 'header') {
        newCategory = row.category === 'other' ? null : row.category;
        break;
      }
      if (row.type === 'checked_header') break;
    }

    // Interpolate sort_order between neighbours
    const activeItems = data.filter((r): r is ItemRow => r.type === 'item' && r.item.status === 'active');
    const newIdx = activeItems.findIndex(r => r.item.id === movedRow.item.id);
    const prev = activeItems[newIdx - 1]?.item;
    const next = activeItems[newIdx + 1]?.item;

    let newSortOrder: number;
    if (!prev && !next) {
      newSortOrder = Math.floor(Date.now() / 1000);
    } else if (!prev) {
      newSortOrder = next!.sort_order - 10;
    } else if (!next) {
      newSortOrder = prev.sort_order + 10;
    } else {
      newSortOrder = Math.floor((prev.sort_order + next.sort_order) / 2);
    }

    reorderItem.mutate({
      id: movedRow.item.id,
      listId: id,
      category: newCategory,
      sortOrder: newSortOrder,
    });
  };

  const keyExtractor = (row: FlatRow, index: number): string => {
    if (row.type === 'header') return `header-${row.category}`;
    if (row.type === 'checked_header') return 'checked_header';
    return `item-${row.item.id}`;
  };

  const renderItem = ({ item: row, drag, isActive }: RenderItemParams<FlatRow>) => {
    if (row.type === 'header') {
      return <CategoryHeader category={row.category} count={row.count} />;
    }
    if (row.type === 'checked_header') {
      return (
        <View style={{ paddingHorizontal: 24, paddingVertical: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.muted, letterSpacing: 1, textTransform: 'uppercase' }}>
            {t('list.checked_items')}
          </Text>
        </View>
      );
    }
    const { item } = row;
    return (
      <ScaleDecorator activeScale={0.97}>
        <ItemCard
          item={item}
          onToggle={() => {
            if (item.status === 'active') soundCheck();
            toggleItem.mutate({ id: item.id, listId: id, status: item.status === 'active' ? 'checked' : 'active' });
          }}
          onDelete={() => deleteItem.mutate({ id: item.id, listId: id })}
          drag={drag}
          isActive={isActive}
        />
      </ScaleDecorator>
    );
  };

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
          <Text style={{ color: Colors.green, fontSize: 16, fontWeight: '500' }}>{t('list.back')}</Text>
        </Pressable>
        <Pressable
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.creamCard, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}
          onPress={() => setShowShare(true)}>
          <Ionicons name="share-outline" size={18} color={Colors.greenDark} />
        </Pressable>
      </View>

      <DraggableFlatList
        data={flatData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onDragEnd={handleDragEnd}
        activationDistance={10}
        ListHeaderComponent={
          <View>
            {/* Title + remaining count */}
            <View style={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: 16 }}>
              <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 32, color: Colors.greenDark }}>
                {list?.name ?? ''}
              </Text>
              <Text style={{ fontSize: 13, color: Colors.muted, marginTop: 4 }}>
                {total - checkedCount} {t('list.remaining')}
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
                  : <Text style={{ color: 'white', fontWeight: '600', fontSize: 15 }}>{t('list.add_button')}</Text>}
              </Pressable>
            </View>
            {addError ? (
              <Text style={{ color: '#c0392b', fontSize: 13, marginHorizontal: 16, marginBottom: 8 }}>{addError}</Text>
            ) : null}

            {/* Quick actions */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 16 }}>
              {[
                { icon: 'camera-outline' as const, label: t('list.import_image'), onPress: () => router.push('/import/image') },
                { icon: 'link-outline' as const, label: t('list.import_recipe'), onPress: () => router.push('/import/recipe') },
                { icon: 'trash-outline' as const, label: t('list.clear_checked'), onPress: () => clearChecked.mutate(id) },
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

            {/* Progress bar */}
            {total > 0 && (
              <View style={{ marginHorizontal: 24, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 12, color: Colors.muted, fontWeight: '500' }}>
                    {t('list.progress', { checked: checkedCount, total })}
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
        ListEmptyComponent={isLoading ? <ActivityIndicator color={Colors.green} style={{ marginTop: 40 }} /> : null}
        contentContainerStyle={{ paddingBottom: 32 }}
      />

      {showShare && <ShareSheet listId={id} onClose={() => setShowShare(false)} />}
    </KeyboardAvoidingView>
  );
}
