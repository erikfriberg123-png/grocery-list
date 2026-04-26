import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, Text, View, Pressable } from 'react-native';

import { Colors, categoryColor } from '@/constants/colors';
import { supabase } from '@/src/lib/supabase';

type GuestItem = {
  id: string;
  name: string;
  category: string | null;
  quantity: number | null;
  unit: string | null;
  status: string;
  sort_order: number;
};

type GuestData = {
  listId: string;
  listName: string;
  permission: string;
  items: GuestItem[];
};

const CATEGORY_ORDER = [
  'produce', 'dairy', 'meat', 'frozen', 'bakery', 'pantry', 'drinks', 'snacks', 'hygiene',
];

export default function GuestView() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { t } = useTranslation();
  const [data, setData]     = useState<GuestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    supabase.functions
      .invoke('validate-share-link', { body: { token } })
      .then(({ data: res, error: fnErr }) => {
        if (fnErr || res?.error) {
          setError(res?.error ?? fnErr?.message ?? 'Invalid link');
        } else {
          setData(res as GuestData);
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.green} size="large" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Ionicons name="link-outline" size={48} color={Colors.muted} style={{ marginBottom: 16 }} />
        <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 22, color: Colors.greenDark, marginBottom: 8, textAlign: 'center' }}>
          {t('error.invalid_link')}
        </Text>
        <Text style={{ fontSize: 14, color: Colors.muted, textAlign: 'center' }}>{error}</Text>
      </View>
    );
  }

  const active  = data.items.filter((i) => i.status === 'active');
  const checked = data.items.filter((i) => i.status === 'checked');

  const groups = active.reduce<Record<string, GuestItem[]>>((acc, item) => {
    const key = item.category ?? 'other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const sections = [
    ...CATEGORY_ORDER.filter((c) => groups[c]?.length).map((c) => ({ category: c, items: groups[c] })),
    ...(groups['other']?.length ? [{ category: 'other', items: groups['other'] }] : []),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <View style={{ backgroundColor: `${Colors.green}20`, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.green, letterSpacing: 0.8 }}>
              {t('guest.viewing_list').toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 32, color: Colors.greenDark }}>
          {data.listName}
        </Text>
        <Text style={{ fontSize: 13, color: Colors.muted, marginTop: 4 }}>
          {active.length} {t('list.remaining')}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {sections.map(({ category, items }) => (
          <View key={category}>
            {/* Category header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 8 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: categoryColor(category) }} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.text, letterSpacing: 1, textTransform: 'uppercase' }}>
                {t(`category.${category}`, { defaultValue: category })}
              </Text>
              <Text style={{ fontSize: 12, color: Colors.muted }}>{items.length}</Text>
            </View>

            {/* Items */}
            {items.map((item) => (
              <View key={item.id} style={{ backgroundColor: Colors.creamCard, marginHorizontal: 16, marginBottom: 8, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: 'transparent' }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#d4cfc1', flexShrink: 0 }} />
                <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.text }}>{item.name}</Text>
                {(item.quantity || item.unit) && (
                  <Text style={{ fontSize: 13, color: Colors.muted }}>{[item.quantity, item.unit].filter(Boolean).join(' ')}</Text>
                )}
              </View>
            ))}
          </View>
        ))}

        {checked.length > 0 && (
          <View>
            <View style={{ paddingHorizontal: 24, paddingVertical: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.muted, letterSpacing: 1, textTransform: 'uppercase' }}>
                {t('list.checked_items')}
              </Text>
            </View>
            {checked.map((item) => (
              <View key={item.id} style={{ backgroundColor: Colors.creamCard, marginHorizontal: 16, marginBottom: 8, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, opacity: 0.5 }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.green, backgroundColor: Colors.green, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="checkmark" size={14} color="white" />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.text, textDecorationLine: 'line-through' }}>{item.name}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={{ textAlign: 'center', fontSize: 12, color: Colors.muted, marginTop: 24 }}>
          {t('guest.sign_up_prompt')}
        </Text>
      </ScrollView>
    </View>
  );
}
