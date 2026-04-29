import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from '@/src/components/DraggableList';
import QRCode from 'react-native-qrcode-svg';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
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

import { categoryColor } from '@/constants/colors';
import { useThemeColors } from '@/src/features/theme/use-theme';
import { soundAdd, soundCheck, soundReorder } from '@/src/lib/sounds';
import { useList } from '@/src/features/lists/use-lists';
import { useSaveAsTemplate } from '@/src/features/templates/use-templates';
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

type HeaderRow        = { type: 'header'; category: string; count: number };
type ItemRow          = { type: 'item'; item: Item };
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
  const colors = useThemeColors();
  const checked = item.status === 'checked';
  return (
    <Pressable
      onLongPress={!checked ? drag : undefined}
      delayLongPress={150}
      style={({ pressed }) => ({
        backgroundColor: colors.creamCard,
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 14,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: isActive ? colors.green : 'transparent',
        opacity: checked ? 0.5 : (pressed ? 0.85 : 1),
        elevation: isActive ? 4 : 0,
      })}>

      <Pressable
        onPress={onToggle}
        onLongPress={() => {}}
        delayLongPress={150}
        hitSlop={{ top: 10, bottom: 10, left: 4, right: 10 }}
        style={{
          width: 24, height: 24, borderRadius: 12,
          borderWidth: 2,
          borderColor: checked ? colors.green : colors.checkBorder,
          backgroundColor: checked ? colors.green : 'transparent',
          alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
        {checked && <Ionicons name="checkmark" size={14} color="white" />}
      </Pressable>

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, textDecorationLine: checked ? 'line-through' : 'none' }}>
            {item.name}
          </Text>
          {(item.quantity || item.unit) && (
            <Text style={{ fontSize: 13, color: colors.muted }}>
              {[item.quantity, item.unit].filter(Boolean).join(' ')}
            </Text>
          )}
        </View>
      </View>

      {checked ? (
        <Pressable
          onPress={onDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ padding: 4 }}>
          <Ionicons name="trash-outline" size={16} color={colors.muted} />
        </Pressable>
      ) : (
        <View style={{ padding: 4 }}>
          <Ionicons name="reorder-three-outline" size={22} color={colors.checkBorder} />
        </View>
      )}
    </Pressable>
  );
}

function CategoryHeader({ category: cat, count }: { category: string; count: number }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const color = categoryColor(cat);
  const label = t(`category.${cat}`, { defaultValue: cat });
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, letterSpacing: 1, textTransform: 'uppercase' }}>
          {label}
        </Text>
      </View>
      {count > 0 && (
        <Text style={{ fontSize: 12, color: colors.muted, fontWeight: '500' }}>{count}</Text>
      )}
    </View>
  );
}

function ShoppingItemRow({ item, onToggle }: { item: Item; onToggle: () => void }) {
  const colors = useThemeColors();
  const checked = item.status === 'checked';
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 15,
        paddingHorizontal: 20,
        backgroundColor: pressed ? colors.pressedBg : 'transparent',
      })}>
      <View style={{
        width: 28, height: 28, borderRadius: 14,
        borderWidth: 2,
        borderColor: checked ? colors.green : colors.checkBorder,
        backgroundColor: checked ? colors.green : 'transparent',
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {checked && <Ionicons name="checkmark" size={16} color="white" />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: 17,
          fontWeight: '500',
          color: checked ? colors.muted : colors.text,
          textDecorationLine: checked ? 'line-through' : 'none',
        }}>
          {item.name}
        </Text>
        {(item.quantity || item.unit) && (
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 1 }}>
            {[item.quantity, item.unit].filter(Boolean).join(' ')}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

function ShareSheet({ listId, onClose }: { listId: string; onClose: () => void }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [selectedDays, setSelectedDays] = useState<number | null>(7);
  const { shareUrl, loading, error, copied, createLink, copyLink } = useShareLink(listId);

  return (
    <Modal visible transparent animationType="slide">
      <Pressable style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={onClose}>
        <Pressable style={{ backgroundColor: colors.cream, borderRadius: 24, padding: 24, paddingBottom: 40 }}>
          <View style={{ width: 36, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />

          <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 22, color: colors.greenDark, marginBottom: 20 }}>
            {t('share.title')}
          </Text>

          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
            {t('share.expiry_label')}
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
                    borderColor: active ? colors.green : colors.border,
                    backgroundColor: active ? `${colors.green}12` : colors.creamCard,
                  }}>
                  <Text style={{ fontSize: 12, fontWeight: active ? '700' : '500', color: active ? colors.green : colors.text }}>
                    {t(opt.key)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {!shareUrl && (
            <Pressable
              style={{ backgroundColor: colors.green, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 8 }}
              onPress={() => createLink(selectedDays)}
              disabled={loading}>
              {loading
                ? <ActivityIndicator color="white" />
                : <Text style={{ color: 'white', fontWeight: '600', fontSize: 15 }}>{t('share.title')}</Text>}
            </Pressable>
          )}

          {error && (
            <Text style={{ color: colors.dangerText, fontSize: 13, textAlign: 'center', marginBottom: 8 }}>{error}</Text>
          )}

          {shareUrl && (
            <View style={{ alignItems: 'center', gap: 16 }}>
              <View style={{ backgroundColor: colors.creamCard, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}>
                <QRCode value={shareUrl} size={180} color={colors.greenDark} backgroundColor={colors.creamCard} />
              </View>
              <Text style={{ fontSize: 12, color: colors.muted, textAlign: 'center' }} numberOfLines={2}>{shareUrl}</Text>
              <Pressable
                style={{ backgroundColor: copied ? colors.greenLight : colors.green, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                onPress={copyLink}>
                <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color={copied ? colors.greenDark : 'white'} />
                <Text style={{ color: copied ? colors.greenDark : 'white', fontWeight: '600', fontSize: 15 }}>
                  {copied ? t('share.copied') : t('share.copy_link')}
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
  const colors = useThemeColors();
  const { data: list } = useList(id);
  const { data: items, isLoading, error: itemsError } = useItems(id);
  const addItems     = useAddItems();
  const toggleItem   = useToggleItem();
  const deleteItem   = useDeleteItem();
  const clearChecked = useClearChecked();
  const reorderItem  = useReorderItem();

  const saveAsTemplate = useSaveAsTemplate();

  const [input, setInput]             = useState('');
  const [addError, setAddError]       = useState('');
  const [showShare, setShowShare]     = useState(false);
  const [showSaveTpl, setShowSaveTpl] = useState(false);
  const [tplName, setTplName]         = useState('');
  const [tplSaved, setTplSaved]       = useState(false);
  const [shoppingMode, setShoppingMode] = useState(false);
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

  const active       = items?.filter((i) => i.status === 'active') ?? [];
  const checked      = items?.filter((i) => i.status === 'checked') ?? [];
  const total        = items?.length ?? 0;
  const checkedCount = checked.length;
  const progressPct  = total === 0 ? 0 : Math.round((checkedCount / total) * 100);

  const shoppingGroups = useMemo(() => {
    return (items ?? []).reduce<Record<string, Item[]>>((acc, item) => {
      const key = item.category ?? 'other';
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [items]);

  const shoppingCategories = useMemo(() => {
    return [...CATEGORY_ORDER, 'other'].filter(
      (cat) => (shoppingGroups[cat]?.length ?? 0) > 0,
    );
  }, [shoppingGroups]);

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
      if (catItems.length === 0) continue;
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

  const handleDragEnd = useCallback(({ data, from, to }: { data: FlatRow[]; from: number; to: number }) => {
    if (from === to) return;
    soundReorder();

    const movedRow = data[to];
    if (movedRow?.type !== 'item' || movedRow.item.status !== 'active') return;

    let newCategory: string | null = null;
    for (let i = to - 1; i >= 0; i--) {
      const row = data[i];
      if (row.type === 'header') {
        newCategory = row.category === 'other' ? null : row.category;
        break;
      }
      if (row.type === 'checked_header') break;
    }

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
  }, [reorderItem, id]);

  const keyExtractor = useCallback((row: FlatRow, _index: number): string => {
    if (row.type === 'header') return `header-${row.category}`;
    if (row.type === 'checked_header') return 'checked_header';
    return `item-${row.item.id}`;
  }, []);

  const renderItem = useCallback(({ item: row, drag, isActive }: RenderItemParams<FlatRow>) => {
    if (row.type === 'header') {
      return <CategoryHeader category={row.category} count={row.count} />;
    }
    if (row.type === 'checked_header') {
      return (
        <View style={{ paddingHorizontal: 24, paddingVertical: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.muted, letterSpacing: 1, textTransform: 'uppercase' }}>
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
  }, [t, id, colors, toggleItem, deleteItem]);

  // ── Shopping mode ─────────────────────────────────────────────────────────
  if (shoppingMode) {
    const donePct = total === 0 ? 0 : Math.round((checkedCount / total) * 100);

    return (
      <View style={{ flex: 1, backgroundColor: colors.cream }}>
        <View style={{
          paddingHorizontal: 20,
          paddingTop: 54,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.cream,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Pressable
              onPress={() => setShoppingMode(false)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: colors.creamCard, borderWidth: 1, borderColor: colors.border }}>
              <Ionicons name="close" size={20} color={colors.greenDark} />
            </Pressable>
            <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 20, color: colors.greenDark, flex: 1, textAlign: 'center', marginHorizontal: 12 }} numberOfLines={1}>
              {list?.name}
            </Text>
            <View style={{ width: 40, alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 14, color: colors.muted, fontWeight: '600' }}>
                {checkedCount}/{total}
              </Text>
            </View>
          </View>
          {total > 0 && (
            <View style={{ height: 3, backgroundColor: colors.border, borderRadius: 2, marginTop: 14, overflow: 'hidden' }}>
              <View style={{ height: 3, backgroundColor: colors.green, borderRadius: 2, width: `${donePct}%` }} />
            </View>
          )}
        </View>

        <ScrollView contentContainerStyle={{ paddingTop: 8, paddingBottom: 48 }}>
          {shoppingCategories.map((cat) => {
            const catItems = shoppingGroups[cat] ?? [];
            const activeInCat = catItems.filter((i) => i.status === 'active').length;
            const sorted = [...catItems].sort((a, b) => {
              if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
              return a.sort_order - b.sort_order;
            });
            return (
              <View key={cat} style={{ marginBottom: 4 }}>
                <CategoryHeader category={cat} count={activeInCat} />
                <View style={{
                  marginHorizontal: 16,
                  borderRadius: 16,
                  backgroundColor: colors.creamCard,
                  borderWidth: 1,
                  borderColor: colors.border,
                  overflow: 'hidden',
                }}>
                  {sorted.map((item, idx) => (
                    <View key={item.id}>
                      {idx > 0 && (
                        <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 62 }} />
                      )}
                      <ShoppingItemRow
                        item={item}
                        onToggle={() => {
                          if (item.status === 'active') soundCheck();
                          toggleItem.mutate({ id: item.id, listId: id, status: item.status === 'active' ? 'checked' : 'active' });
                        }}
                      />
                    </View>
                  ))}
                </View>
              </View>
            );
          })}

          {shoppingCategories.length === 0 && (
            <View style={{ alignItems: 'center', marginTop: 60, gap: 12 }}>
              <Ionicons name="checkmark-circle" size={52} color={colors.green} />
              <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 24, color: colors.greenDark }}>
                {t('list.empty')}
              </Text>
            </View>
          )}

          {checkedCount > 0 && (
            <Pressable
              style={({ pressed }) => ({
                marginHorizontal: 16,
                marginTop: 16,
                paddingVertical: 14,
                borderRadius: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: pressed ? colors.dangerBg : 'transparent',
                borderWidth: 1,
                borderColor: colors.dangerBorder,
              })}
              onPress={() => clearChecked.mutate(id)}>
              <Ionicons name="trash-outline" size={15} color={colors.dangerText} />
              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.dangerText }}>
                {t('list.clear_checked')}
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </View>
    );
  }

  // ── Regular view ──────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.cream }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}>

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingTop: 52, paddingBottom: 4 }}>
        <Pressable
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8 }}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/')}>
          <Ionicons name="chevron-back" size={22} color={colors.green} />
          <Text style={{ color: colors.green, fontSize: 16, fontWeight: '500' }}>{t('list.back')}</Text>
        </Pressable>
        <Pressable
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.creamCard, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}
          onPress={() => setShowShare(true)}>
          <Ionicons name="share-outline" size={18} color={colors.greenDark} />
        </Pressable>
      </View>

      <DraggableFlatList
        data={flatData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onDragEnd={handleDragEnd}
        activationDistance={10}
        containerStyle={{ flex: 1 }}
        ListHeaderComponent={
          <View>
            {/* Title + remaining count */}
            <View style={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: 16 }}>
              <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 32, color: colors.greenDark }}>
                {list?.name ?? ''}
              </Text>
              <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
                {total - checkedCount} {t('list.remaining')}
              </Text>
            </View>

            {/* Add item bar */}
            <View style={{ flexDirection: 'row', gap: 8, marginHorizontal: 16, marginBottom: 12 }}>
              <TextInput
                ref={inputRef}
                style={{ flex: 1, backgroundColor: colors.creamCard, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: colors.text }}
                placeholder={`+ ${t('list.add_item')}…`}
                placeholderTextColor={colors.muted}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={handleAdd}
                returnKeyType="done"
                blurOnSubmit={false}
              />
              <Pressable
                style={{ backgroundColor: colors.green, borderRadius: 14, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' }}
                onPress={handleAdd}
                disabled={addItems.isPending}>
                {addItems.isPending
                  ? <ActivityIndicator color="white" size="small" />
                  : <Text style={{ color: 'white', fontWeight: '600', fontSize: 15 }}>{t('list.add_button')}</Text>}
              </Pressable>
            </View>
            {addError ? (
              <Text style={{ color: colors.dangerText, fontSize: 13, marginHorizontal: 16, marginBottom: 8 }}>{addError}</Text>
            ) : null}

            {/* Quick actions */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 16 }}>
              {[
                { icon: 'download-outline' as const, label: t('list.import'), onPress: () => router.push({ pathname: '/import/image', params: { listId: id } }) },
                { icon: 'bookmark-outline' as const, label: t('template.save_as'), onPress: () => { setTplName(list?.name ?? ''); setTplSaved(false); setShowSaveTpl(true); } },
              ].map(({ icon, label, onPress }) => (
                <Pressable
                  key={label}
                  style={({ pressed }) => ({ backgroundColor: pressed ? colors.pressedBg : colors.creamCard, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6 })}
                  onPress={onPress}>
                  <Ionicons name={icon} size={14} color={colors.greenDark} />
                  <Text style={{ fontSize: 13, fontWeight: '500', color: colors.greenDark }} numberOfLines={1}>{label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Progress bar */}
            {total > 0 && (
              <View style={{ marginHorizontal: 24, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 12, color: colors.muted, fontWeight: '500' }}>
                    {t('list.progress', { checked: checkedCount, total })}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.muted, fontWeight: '500' }}>{progressPct}%</Text>
                </View>
                <View style={{ height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' }}>
                  <View style={{ height: 4, backgroundColor: colors.green, borderRadius: 2, width: `${progressPct}%` }} />
                </View>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={colors.green} style={{ marginTop: 40 }} />
          ) : itemsError ? (
            <Text style={{ color: colors.dangerText, fontSize: 13, textAlign: 'center', marginTop: 40, marginHorizontal: 24 }}>
              {String(itemsError instanceof Error ? itemsError.message : itemsError)}
            </Text>
          ) : (
            <Text style={{ color: colors.muted, fontSize: 14, textAlign: 'center', marginTop: 40 }}>
              {t('list.empty')}
            </Text>
          )
        }
        ListFooterComponent={
          checkedCount > 0 ? (
            <Pressable
              style={({ pressed }) => ({
                marginHorizontal: 16,
                marginTop: 8,
                marginBottom: 4,
                paddingVertical: 14,
                borderRadius: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: pressed ? colors.dangerBg : 'transparent',
                borderWidth: 1,
                borderColor: colors.dangerBorder,
              })}
              onPress={() => clearChecked.mutate(id)}>
              <Ionicons name="trash-outline" size={15} color={colors.dangerText} />
              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.dangerText }}>
                {t('list.clear_checked')}
              </Text>
            </Pressable>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      {/* Shopping mode button */}
      <View style={{ position: 'absolute', bottom: 28, left: 16, right: 16 }}>
        <Pressable
          style={({ pressed }) => ({
            backgroundColor: pressed ? colors.greenDark : colors.green,
            borderRadius: 18,
            paddingVertical: 18,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            shadowColor: '#2d6a4f',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 10,
            elevation: 6,
          })}
          onPress={() => setShoppingMode(true)}>
          <Ionicons name="cart-outline" size={22} color="white" />
          <Text style={{ color: 'white', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 }}>
            {t('list.shopping_mode')}
          </Text>
        </Pressable>
      </View>

      {showShare && <ShareSheet listId={id} onClose={() => setShowShare(false)} />}

      {/* Save as template modal */}
      <Modal visible={showSaveTpl} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}>
        <Pressable
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={() => setShowSaveTpl(false)}>
          <Pressable style={{ backgroundColor: colors.cream, borderRadius: 24, padding: 24, paddingBottom: 40 }}>
            <View style={{ width: 36, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
            <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 22, color: colors.greenDark, marginBottom: 16 }}>
              {t('template.save_as')}
            </Text>
            {tplSaved ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 16 }}>
                <Ionicons name="checkmark-circle" size={24} color={colors.green} />
                <Text style={{ fontSize: 16, color: colors.green, fontWeight: '600' }}>{t('template.saved')}</Text>
              </View>
            ) : (
              <>
                <TextInput
                  style={{ backgroundColor: colors.creamCard, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: colors.text, marginBottom: 16 }}
                  placeholder={t('template.template_name')}
                  placeholderTextColor={colors.muted}
                  value={tplName}
                  onChangeText={setTplName}
                  autoFocus
                />
                <Pressable
                  style={{ backgroundColor: tplName.trim() ? colors.green : colors.border, borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}
                  disabled={!tplName.trim() || saveAsTemplate.isPending}
                  onPress={async () => {
                    await saveAsTemplate.mutateAsync({ listId: id, name: tplName });
                    setTplSaved(true);
                    setTimeout(() => setShowSaveTpl(false), 1200);
                  }}>
                  {saveAsTemplate.isPending
                    ? <ActivityIndicator color="white" />
                    : <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>{t('common.save')}</Text>}
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}
