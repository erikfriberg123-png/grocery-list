import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '@/src/features/auth/use-auth';
import { useCreateList, useLists, useArchiveList, useRenameList } from '@/src/features/lists/use-lists';

export default function ListsScreen() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const { data: lists, isLoading } = useLists();
  const createList = useCreateList();
  const archiveList = useArchiveList();
  const renameList = useRenameList();

  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createList.mutateAsync(newName);
    setNewName('');
    setShowNew(false);
  };

  const handleLongPress = (id: string, name: string) => {
    Alert.alert(name, undefined, [
      {
        text: t('list.rename'),
        onPress: () => {
          Alert.prompt(
            t('list.rename'),
            undefined,
            (text) => { if (text?.trim()) renameList.mutate({ id, name: text }); },
            'plain-text',
            name,
          );
        },
      },
      {
        text: t('list.archive'),
        style: 'destructive',
        onPress: () => archiveList.mutate(id),
      },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pb-3 pt-14">
        <Text className="text-2xl font-bold text-gray-900">{t('list.title')}</Text>
        <View className="flex-row gap-3">
          <Pressable
            className="h-9 w-9 items-center justify-center rounded-full bg-blue-600 active:opacity-70"
            onPress={() => setShowNew(true)}>
            <Text className="text-lg font-semibold text-white">+</Text>
          </Pressable>
          <Pressable onPress={signOut}>
            <Text className="text-sm text-gray-400">{t('auth.sign_out')}</Text>
          </Pressable>
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <ActivityIndicator className="mt-10" />
      ) : (
        <FlatList
          data={lists}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          ListEmptyComponent={
            <View className="mt-20 items-center">
              <Text className="text-base text-gray-400">{t('list.empty')}</Text>
              <Pressable className="mt-4" onPress={() => setShowNew(true)}>
                <Text className="text-base font-medium text-blue-600">{t('list.new_list')}</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              className="mb-3 flex-row items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 active:opacity-70"
              onPress={() => router.push(`/list/${item.id}`)}
              onLongPress={() => handleLongPress(item.id, item.name)}>
              <Text className="text-base font-medium text-gray-900">{item.name}</Text>
              <Text className="text-gray-300">›</Text>
            </Pressable>
          )}
        />
      )}

      {/* New list modal */}
      <Modal visible={showNew} transparent animationType="fade">
        <Pressable
          className="flex-1 items-center justify-center bg-black/40"
          onPress={() => setShowNew(false)}>
          <Pressable className="w-80 rounded-2xl bg-white p-6 shadow-lg">
            <Text className="mb-4 text-lg font-semibold text-gray-900">{t('list.new_list')}</Text>
            <TextInput
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900"
              placeholder={t('list.list_name')}
              autoFocus
              value={newName}
              onChangeText={setNewName}
              onSubmitEditing={handleCreate}
              returnKeyType="done"
            />
            <View className="mt-4 flex-row justify-end gap-3">
              <Pressable onPress={() => setShowNew(false)}>
                <Text className="text-sm font-medium text-gray-500">{t('common.cancel')}</Text>
              </Pressable>
              <Pressable onPress={handleCreate} disabled={createList.isPending}>
                {createList.isPending ? (
                  <ActivityIndicator size="small" />
                ) : (
                  <Text className="text-sm font-semibold text-blue-600">{t('common.done')}</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
