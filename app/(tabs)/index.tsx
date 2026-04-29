import { Ionicons } from '@expo/vector-icons';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useThemeColors } from '@/src/features/theme/use-theme';
import { useCreateList, useDeleteList, useLists, useArchiveList, useRenameList } from '@/src/features/lists/use-lists';
import { useTemplates, useCreateFromTemplate, useDeleteTemplate, useSaveAsTemplate } from '@/src/features/templates/use-templates';

type ListItem = {
  id: string;
  name: string;
  shopping_items?: { id: string; status: string }[];
};

function ProgressBar({ checked, total }: { checked: number; total: number }) {
  const colors = useThemeColors();
  const pct = total === 0 ? 0 : (checked / total) * 100;
  return (
    <View style={{ height: 4, backgroundColor: colors.border, borderRadius: 2, marginTop: 12, overflow: 'hidden' }}>
      <View style={{ height: 4, backgroundColor: colors.green, borderRadius: 2, width: `${pct}%` }} />
    </View>
  );
}

function SwipeableListCard({ list, onPress, onLongPress }: {
  list: ListItem;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const swipeRef = useRef<SwipeableMethods | null>(null);
  const deleteList    = useDeleteList();
  const saveAsTemplate = useSaveAsTemplate();

  const items    = list.shopping_items ?? [];
  const total    = items.length;
  const checked  = items.filter((i) => i.status === 'checked').length;
  const remaining = total - checked;

  const handleDelete = () => {
    Alert.alert(
      t('list.delete'),
      t('list.delete_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel', onPress: () => swipeRef.current?.close() },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            swipeRef.current?.close();
            deleteList.mutate(list.id);
          },
        },
      ],
    );
  };

  const handleSaveTemplate = () => {
    swipeRef.current?.close();
    // Give the close animation a moment, then prompt
    setTimeout(() => {
      Alert.prompt(
        t('template.save_as'),
        t('template.template_name'),
        (name) => {
          if (name?.trim()) {
            saveAsTemplate.mutate({ listId: list.id, name: name.trim() });
          }
        },
        'plain-text',
        list.name,
      );
    }, 280);
  };

  const renderLeftActions = (_progress: unknown, _translation: unknown, methods: SwipeableMethods) => (
    <Pressable
      onPress={() => { methods.close(); handleSaveTemplate(); }}
      style={{
        width: 82,
        marginRight: 8,
        marginBottom: 12,
        borderRadius: 16,
        backgroundColor: colors.green,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
      }}>
      <Ionicons name="bookmark" size={20} color="white" />
      <Text style={{ fontSize: 11, fontWeight: '700', color: 'white', letterSpacing: 0.3 }}>
        {t('template.label')}
      </Text>
    </Pressable>
  );

  const renderRightActions = (_progress: unknown, _translation: unknown, methods: SwipeableMethods) => (
    <Pressable
      onPress={() => { methods.close(); handleDelete(); }}
      style={{
        width: 82,
        marginLeft: 8,
        marginBottom: 12,
        borderRadius: 16,
        backgroundColor: colors.dangerText,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
      }}>
      <Ionicons name="trash" size={20} color="white" />
      <Text style={{ fontSize: 11, fontWeight: '700', color: 'white', letterSpacing: 0.3 }}>
        {t('common.delete')}
      </Text>
    </Pressable>
  );

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      friction={2}
      leftThreshold={60}
      rightThreshold={60}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      containerStyle={{ marginHorizontal: 24, marginBottom: 12 }}>
      <Pressable
        style={({ pressed }) => ({
          backgroundColor: colors.creamCard,
          borderRadius: 16,
          padding: 18,
          borderWidth: 1,
          borderColor: colors.border,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
        onPress={onPress}
        onLongPress={onLongPress}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 22, color: colors.greenDark, flex: 1 }}>
            {list.name}
          </Text>
          {total > 0 && (
            <View style={{ backgroundColor: colors.green, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                {remaining} {t('list.remaining')}
              </Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: 13, color: colors.muted }}>
          {t('list.progress', { checked, total })}
        </Text>
        <ProgressBar checked={checked} total={total} />
      </Pressable>
    </ReanimatedSwipeable>
  );
}

export default function ListsScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { data: lists, isLoading } = useLists();
  const createList  = useCreateList();
  const archiveList = useArchiveList();
  const renameList  = useRenameList();

  const { data: templates } = useTemplates();
  const createFromTemplate = useCreateFromTemplate();
  const deleteTemplate     = useDeleteTemplate();

  const [showNew, setShowNew]         = useState(false);
  const [newName, setNewName]         = useState('');
  const [createError, setCreateError] = useState('');
  const [showTpl, setShowTpl]         = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreateError('');
    try {
      await createList.mutateAsync(newName.trim());
      setNewName('');
      setShowNew(false);
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleLongPress = (id: string, name: string) => {
    Alert.alert(name, undefined, [
      {
        text: t('list.rename'),
        onPress: () =>
          Alert.prompt(t('list.rename'), undefined, (text) => {
            if (text?.trim()) renameList.mutate({ id, name: text });
          }, 'plain-text', name),
      },
      {
        text: t('list.archive'),
        style: 'destructive',
        onPress: () => archiveList.mutate(id),
      },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const activeCount = lists?.length ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16 }}>
        <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 34, color: colors.greenDark, lineHeight: 40 }}>
          {t('list.title')}
        </Text>
        <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
          {t('list.active_count', { count: activeCount })}
        </Text>
      </View>

      {/* List */}
      {isLoading ? (
        <ActivityIndicator color={colors.green} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          {(lists ?? []).map((list) => (
            <SwipeableListCard
              key={list.id}
              list={list as unknown as ListItem}
              onPress={() => router.push(`/list/${list.id}`)}
              onLongPress={() => handleLongPress(list.id, list.name)}
            />
          ))}

          {/* New list dashed button */}
          <Pressable
            style={({ pressed }) => ({
              marginHorizontal: 24,
              marginTop: 4,
              padding: 16,
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: pressed ? colors.green : colors.border,
              borderRadius: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            })}
            onPress={() => setShowNew(true)}>
            <Ionicons name="add" size={18} color={colors.muted} />
            <Text style={{ fontSize: 15, fontWeight: '500', color: colors.muted }}>
              {t('list.new_list')}
            </Text>
          </Pressable>

          {/* From template button */}
          {(templates?.length ?? 0) > 0 && (
            <Pressable
              style={({ pressed }) => ({
                marginHorizontal: 24,
                marginTop: 8,
                padding: 16,
                borderWidth: 1,
                borderColor: pressed ? colors.green : colors.border,
                borderRadius: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: colors.creamCard,
              })}
              onPress={() => setShowTpl(true)}>
              <Ionicons name="bookmark-outline" size={16} color={colors.greenDark} />
              <Text style={{ fontSize: 15, fontWeight: '500', color: colors.greenDark }}>
                {t('template.from_template')}
              </Text>
            </Pressable>
          )}
        </ScrollView>
      )}

      {/* From template modal */}
      <Modal visible={showTpl} transparent animationType="slide">
        <Pressable
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={() => setShowTpl(false)}>
          <Pressable style={{ backgroundColor: colors.cream, borderRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '70%' }}>
            <View style={{ width: 36, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
            <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 22, color: colors.greenDark, marginBottom: 16 }}>
              {t('template.choose')}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {(templates ?? []).map((tpl) => (
                <Pressable
                  key={tpl.id}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? colors.greenLight : colors.creamCard,
                    borderRadius: 14,
                    padding: 16,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  })}
                  onPress={async () => {
                    setShowTpl(false);
                    const listId = await createFromTemplate.mutateAsync({ templateId: tpl.id, name: tpl.name });
                    router.push(`/list/${listId}`);
                  }}
                  onLongPress={() =>
                    Alert.alert(tpl.name, undefined, [
                      {
                        text: t('template.delete'),
                        style: 'destructive',
                        onPress: () => deleteTemplate.mutate(tpl.id),
                      },
                      { text: t('common.cancel'), style: 'cancel' },
                    ])
                  }>
                  <View style={{ gap: 2 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>{tpl.name}</Text>
                    <Text style={{ fontSize: 13, color: colors.muted }}>
                      {t('template.items', { count: tpl.list_template_items.length })}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* New list modal */}
      <Modal visible={showNew} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}>
          <Pressable
            style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}
            onPress={() => { setShowNew(false); setCreateError(''); }}>
            <Pressable style={{ backgroundColor: colors.cream, borderRadius: 24, padding: 24, paddingBottom: 40 }}>
              <View style={{ width: 36, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
              <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 22, color: colors.greenDark, marginBottom: 16 }}>
                {t('list.new_list')}
              </Text>
              <TextInput
                style={{ backgroundColor: colors.creamCard, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: colors.text, marginBottom: 16 }}
                placeholder={t('list.list_name')}
                placeholderTextColor={colors.muted}
                autoFocus
                value={newName}
                onChangeText={setNewName}
                onSubmitEditing={handleCreate}
                returnKeyType="done"
              />
              {createError ? (
                <Text style={{ color: colors.dangerText, fontSize: 13, marginBottom: 10 }}>{createError}</Text>
              ) : null}
              <Pressable
                style={{ backgroundColor: colors.green, borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}
                onPress={handleCreate}
                disabled={createList.isPending}>
                {createList.isPending
                  ? <ActivityIndicator color="white" />
                  : <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>{t('common.done')}</Text>}
              </Pressable>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
