import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Colors } from '@/constants/colors';
import { useCreateList, useLists, useArchiveList, useRenameList } from '@/src/features/lists/use-lists';

function LogoIcon() {
  return (
    <View style={{ width: 36, height: 36, backgroundColor: Colors.green, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name="leaf" size={18} color="white" />
    </View>
  );
}

function ProgressBar({ checked, total }: { checked: number; total: number }) {
  const pct = total === 0 ? 0 : (checked / total) * 100;
  return (
    <View style={{ height: 4, backgroundColor: Colors.border, borderRadius: 2, marginTop: 12, overflow: 'hidden' }}>
      <View style={{ height: 4, backgroundColor: Colors.green, borderRadius: 2, width: `${pct}%` }} />
    </View>
  );
}

export default function ListsScreen() {
  const { t } = useTranslation();
  const { data: lists, isLoading } = useLists();
  const createList = useCreateList();
  const archiveList = useArchiveList();
  const renameList = useRenameList();

  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [createError, setCreateError] = useState('');

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
    <View style={{ flex: 1, backgroundColor: Colors.cream }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <LogoIcon />
          <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 20, color: Colors.greenDark }}>Lista</Text>
        </View>
        <Pressable
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.creamCard, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' }}
          onPress={() => router.push('/household')}>
          <Ionicons name="settings-outline" size={18} color={Colors.greenDark} />
        </Pressable>
      </View>

      {/* Page title */}
      <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 20 }}>
        <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 36, color: Colors.greenDark, lineHeight: 40 }}>
          {t('list.title')}
        </Text>
        <Text style={{ fontSize: 14, color: Colors.muted, marginTop: 4 }}>
          {activeCount} aktiva · 1 hushåll
        </Text>
      </View>

      {/* List */}
      {isLoading ? (
        <ActivityIndicator color={Colors.green} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          {(lists ?? []).map((list) => {
            const items = (list as any).shopping_items as { id: string; status: string }[] ?? [];
            const total = items.length;
            const checked = items.filter((i) => i.status === 'checked').length;
            const remaining = total - checked;

            return (
              <Pressable
                key={list.id}
                style={({ pressed }) => ({
                  backgroundColor: Colors.creamCard,
                  borderRadius: 16,
                  padding: 18,
                  marginHorizontal: 24,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                })}
                onPress={() => router.push(`/list/${list.id}`)}
                onLongPress={() => handleLongPress(list.id, list.name)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 22, color: Colors.greenDark, flex: 1 }}>
                    {list.name}
                  </Text>
                  {total > 0 && (
                    <View style={{ backgroundColor: Colors.green, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                        {remaining} kvar
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 13, color: Colors.muted }}>
                  {checked} av {total} varor klara
                </Text>
                <ProgressBar checked={checked} total={total} />
              </Pressable>
            );
          })}

          {/* New list dashed button */}
          <Pressable
            style={({ pressed }) => ({
              marginHorizontal: 24,
              marginTop: 4,
              padding: 16,
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: pressed ? Colors.green : Colors.border,
              borderRadius: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            })}
            onPress={() => setShowNew(true)}>
            <Ionicons name="add" size={18} color={Colors.muted} />
            <Text style={{ fontSize: 15, fontWeight: '500', color: Colors.muted }}>
              {t('list.new_list')}
            </Text>
          </Pressable>
        </ScrollView>
      )}

      {/* New list modal */}
      <Modal visible={showNew} transparent animationType="slide">
        <Pressable
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}
          onPress={() => { setShowNew(false); setCreateError(''); }}>
          <Pressable style={{ backgroundColor: Colors.cream, borderRadius: 24, padding: 24, marginHorizontal: 0, paddingBottom: 40 }}>
            {/* Handle */}
            <View style={{ width: 36, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
            <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 22, color: Colors.greenDark, marginBottom: 16 }}>
              {t('list.new_list')}
            </Text>
            <TextInput
              style={{ backgroundColor: Colors.creamCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: Colors.text, marginBottom: 16 }}
              placeholder={t('list.list_name')}
              placeholderTextColor={Colors.muted}
              autoFocus
              value={newName}
              onChangeText={setNewName}
              onSubmitEditing={handleCreate}
              returnKeyType="done"
            />
            {createError ? (
              <Text style={{ color: '#c0392b', fontSize: 13, marginBottom: 10 }}>{createError}</Text>
            ) : null}
            <Pressable
              style={{ backgroundColor: Colors.green, borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}
              onPress={handleCreate}
              disabled={createList.isPending}>
              {createList.isPending
                ? <ActivityIndicator color="white" />
                : <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>{t('common.done')}</Text>}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
