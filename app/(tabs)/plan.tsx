import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import {
  Animated,
  ActivityIndicator,
  Easing,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
} from 'react-native';
import Svg, { Path, Circle, G, Text as SvgText } from 'react-native-svg';

import { useThemeColors } from '@/src/features/theme/use-theme';
import { useRecipes, recipeImageUrl, type Recipe } from '@/src/features/recipes/use-recipes';
import { useMealPlan, useUpsertMeal, useDeleteMeal, type MealPlan } from '@/src/features/plan/use-meal-plan';

// ── wheel constants ──────────────────────────────────────────────────────────

const WHEEL_SIZE = 290;
const WHEEL_R    = WHEEL_SIZE / 2 - 4;
const CX         = WHEEL_SIZE / 2;
const CY         = WHEEL_SIZE / 2;
const SEG_COLORS = ['#1b4332', '#2d6a4f', '#40916c', '#52b788', '#74c69d'];

function toRad(deg: number) {
  return ((deg - 90) * Math.PI) / 180;
}

function segPath(startDeg: number, endDeg: number): string {
  const x1 = CX + WHEEL_R * Math.cos(toRad(startDeg));
  const y1 = CY + WHEEL_R * Math.sin(toRad(startDeg));
  const x2 = CX + WHEEL_R * Math.cos(toRad(endDeg));
  const y2 = CY + WHEEL_R * Math.sin(toRad(endDeg));
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${CX} ${CY} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${WHEEL_R} ${WHEEL_R} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
}

// ── wheel modal ──────────────────────────────────────────────────────────────

function WheelModal({ recipes, visible, onClose }: { recipes: Recipe[]; visible: boolean; onClose: () => void }) {
  const { t }   = useTranslation();
  const colors      = useThemeColors();
  const spinValue   = useRef(new Animated.Value(0)).current;
  const currentDeg  = useRef(0);
  const [spinning, setSpinning] = useState(false);
  const [result,   setResult]   = useState<Recipe | null>(null);
  const recipesRef  = useRef(recipes);
  recipesRef.current = recipes;

  useEffect(() => {
    if (visible) {
      spinValue.setValue(0);
      currentDeg.current = 0;
      setResult(null);
      setSpinning(false);
    }
  }, [visible]);

  const rotate = spinValue.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'extend',
  });

  const spin = useCallback(() => {
    const n = recipesRef.current.length;
    if (spinning || n === 0) return;
    setResult(null);
    setSpinning(true);

    const segAngle  = 360 / n;
    const targetIdx = Math.floor(Math.random() * n);
    const targetAngle = (360 - targetIdx * segAngle - segAngle / 2 + 360) % 360;
    const current     = ((currentDeg.current % 360) + 360) % 360;
    const delta       = (targetAngle - current + 360) % 360;
    const extraSpins  = (5 + Math.floor(Math.random() * 4)) * 360;
    const newDeg      = currentDeg.current + delta + extraSpins;

    Animated.timing(spinValue, {
      toValue: newDeg,
      duration: 4000 + Math.random() * 1500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        currentDeg.current = newDeg;
        setSpinning(false);
        setResult(recipesRef.current[targetIdx] ?? null);
      }
    });
  }, [spinning, spinValue]);

  const n        = recipes.length;
  const segAngle = n > 0 ? 360 / n : 360;
  const fontSize = n > 12 ? 8 : n > 8 ? 10 : 11;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center' }}
        onPress={spinning ? undefined : onClose}>
        <Pressable style={{ backgroundColor: colors.cream, borderRadius: 28, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 28, width: '92%', alignItems: 'center' }}>

          <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 24, color: colors.greenDark, marginBottom: 20, textAlign: 'center' }}>
            {t('plan.random_title')}
          </Text>

          {n === 0 ? (
            <Text style={{ color: colors.muted, fontSize: 15, marginVertical: 32 }}>{t('plan.no_recipes')}</Text>
          ) : (
            <View style={{ alignItems: 'center', width: '100%' }}>
              {/* Pointer */}
              <View style={{ width: 0, height: 0, borderLeftWidth: 11, borderRightWidth: 11, borderTopWidth: 20, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: colors.greenDark, zIndex: 10, marginBottom: -2 }} />

              {/* Spinning wheel */}
              <Animated.View style={{ width: WHEEL_SIZE, height: WHEEL_SIZE, transform: [{ rotate }] }}>
                <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
                  {recipes.map((recipe, i) => {
                    const start  = i * segAngle;
                    const end    = (i + 1) * segAngle;
                    const mid    = (start + end) / 2;
                    const textR  = WHEEL_R * 0.63;
                    const tx     = CX + textR * Math.cos(toRad(mid));
                    const ty     = CY + textR * Math.sin(toRad(mid));
                    const label  = recipe.name.length > 14 ? recipe.name.slice(0, 13) + '…' : recipe.name;
                    return (
                      <G key={recipe.id}>
                        <Path
                          d={segPath(start, end)}
                          fill={SEG_COLORS[i % SEG_COLORS.length]}
                          stroke={colors.cream}
                          strokeWidth={1.5}
                        />
                        <SvgText
                          x={tx} y={ty}
                          rotation={mid} originX={tx} originY={ty}
                          textAnchor="middle" alignmentBaseline="middle"
                          fontSize={fontSize} fontWeight="600"
                          fill={(i % SEG_COLORS.length) < 3 ? 'white' : '#1b4332'}
                        >
                          {label}
                        </SvgText>
                      </G>
                    );
                  })}
                  <Circle cx={CX} cy={CY} r={26} fill={colors.cream} />
                  <Circle cx={CX} cy={CY} r={20} fill={colors.greenDark} />
                </Svg>
              </Animated.View>

              {/* Result */}
              <View style={{ minHeight: 60, justifyContent: 'center', alignItems: 'center', marginTop: 16 }}>
                {result ? (
                  <>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 4 }}>
                      {t('plan.random_result')}
                    </Text>
                    <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 26, color: colors.greenDark, textAlign: 'center' }}>
                      {result.name}
                    </Text>
                  </>
                ) : null}
              </View>

              {/* Spin button */}
              <Pressable
                onPress={spin}
                disabled={spinning}
                style={({ pressed }) => ({
                  marginTop: 8,
                  backgroundColor: spinning ? colors.border : pressed ? colors.greenDark : colors.green,
                  borderRadius: 16, paddingVertical: 15, paddingHorizontal: 44,
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                })}>
                <Ionicons name="shuffle" size={20} color={spinning ? colors.muted : 'white'} />
                <Text style={{ color: spinning ? colors.muted : 'white', fontWeight: '700', fontSize: 16 }}>
                  {spinning ? t('plan.random_spinning') : t('plan.random_spin')}
                </Text>
              </Pressable>
            </View>
          )}

          {!spinning && (
            <Pressable onPress={onClose} style={{ marginTop: 14 }}>
              <Text style={{ color: colors.muted, fontSize: 14 }}>{t('common.done')}</Text>
            </Pressable>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── date helpers ────────────────────────────────────────────────────────────

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function getISOWeek(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(
    ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7,
  );
}

function formatWeekRange(monday: Date): string {
  const locale = i18n.language ?? 'en';
  const sunday = addDays(monday, 6);
  const fmt = (d: Date) => d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

function formatDayLabel(date: Date): { weekday: string; date: string } {
  const locale = i18n.language ?? 'en';
  return {
    weekday: date.toLocaleDateString(locale, { weekday: 'short' }),
    date:    date.toLocaleDateString(locale, { month: 'short', day: 'numeric' }),
  };
}

// ── sub-components ──────────────────────────────────────────────────────────

function RecipeThumb({ imagePath, size = 40 }: { imagePath: string | null; size?: number }) {
  const colors = useThemeColors();
  const url    = recipeImageUrl(imagePath);
  if (url) {
    return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 4 }} />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 4, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name="restaurant-outline" size={size * 0.5} color={colors.muted} />
    </View>
  );
}

function DayCard({
  dayIndex,
  weekStart,
  today,
  plan,
  onPress,
}: {
  dayIndex: number;
  weekStart: Date;
  today: Date;
  plan?: MealPlan;
  onPress: () => void;
}) {
  const { t }   = useTranslation();
  const colors  = useThemeColors();
  const dayDate = addDays(weekStart, dayIndex);
  const past    = dayDate < today && !isSameDay(dayDate, today);
  const isToday = isSameDay(dayDate, today);
  const { weekday, date } = formatDayLabel(dayDate);

  const mealLabel = plan?.recipes?.name ?? plan?.meal_name ?? null;

  return (
    <Pressable
      onPress={past ? undefined : onPress}
      style={({ pressed }) => ({
        flexDirection:   'row',
        alignItems:      'center',
        marginHorizontal: 16,
        marginBottom:    10,
        borderRadius:    16,
        padding:         14,
        gap:             12,
        backgroundColor: colors.creamCard,
        borderWidth:     isToday ? 1.5 : 1,
        borderColor:     isToday ? colors.green : colors.border,
        opacity:         (past ? 0.45 : 1) * (pressed ? 0.8 : 1),
      })}>
      {/* Day label */}
      <View style={{ width: 48 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: isToday ? colors.green : colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {weekday}
        </Text>
        <Text style={{ fontSize: 12, color: colors.muted, marginTop: 1 }}>
          {date}
        </Text>
      </View>

      {/* Meal info */}
      <View style={{ flex: 1 }}>
        {mealLabel ? (
          <Text style={{ fontSize: 15, color: colors.text, fontWeight: '500' }} numberOfLines={1}>
            {mealLabel}
          </Text>
        ) : (
          <Text style={{ fontSize: 14, color: colors.muted }}>
            {past ? '—' : t('plan.add_dinner')}
          </Text>
        )}
      </View>

      {/* Recipe image or chevron */}
      {plan?.recipes ? (
        <RecipeThumb imagePath={plan.recipes.image_path} size={36} />
      ) : mealLabel ? (
        <View style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="restaurant-outline" size={18} color={colors.muted} />
        </View>
      ) : !past ? (
        <Ionicons name="chevron-forward" size={16} color={colors.muted} />
      ) : null}
    </Pressable>
  );
}

// ── main screen ─────────────────────────────────────────────────────────────

export default function PlanScreen() {
  const { t }  = useTranslation();
  const colors = useThemeColors();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOfWeek(today));
  const weekStartStr = toISODate(weekStart);
  const weekNum      = getISOWeek(weekStart);

  const prevWeek = useCallback(() => setWeekStart(w => addDays(w, -7)), []);
  const nextWeek = useCallback(() => setWeekStart(w => addDays(w,  7)), []);

  const { data: mealPlans = [], isLoading } = useMealPlan(weekStartStr);
  const { data: recipes   = [] }            = useRecipes();
  const upsertMeal = useUpsertMeal();
  const deleteMeal = useDeleteMeal();

  const planByDay = useMemo(() => {
    const map: Record<number, MealPlan> = {};
    mealPlans.forEach(mp => { map[mp.day] = mp; });
    return map;
  }, [mealPlans]);

  const [showWheel, setShowWheel] = useState(false);

  // Sheet state
  const [selectedDay, setSelectedDay]   = useState<number | null>(null);
  const [mealInput,   setMealInput]     = useState('');
  const [recipeSearch, setRecipeSearch] = useState('');
  const [saving, setSaving]             = useState(false);
  const [saveError, setSaveError]       = useState<string | null>(null);

  const selectedPlan = selectedDay != null ? planByDay[selectedDay] : undefined;

  const openDay = useCallback((day: number) => {
    const plan = planByDay[day];
    setMealInput(plan?.meal_name ?? '');
    setRecipeSearch('');
    setSaving(false);
    setSaveError(null);
    setSelectedDay(day);
  }, [planByDay]);

  const closeSheet = useCallback(() => {
    setSelectedDay(null);
    setSaveError(null);
  }, []);

  const saveFreeText = useCallback(async () => {
    if (!mealInput.trim() || selectedDay == null) return;
    setSaving(true);
    setSaveError(null);
    try {
      await upsertMeal.mutateAsync({ weekStart: weekStartStr, day: selectedDay, mealName: mealInput.trim(), recipeId: null });
      closeSheet();
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [mealInput, selectedDay, weekStartStr, upsertMeal, closeSheet]);

  const pickRecipe = useCallback(async (recipe: Recipe) => {
    if (selectedDay == null) return;
    setSaving(true);
    setSaveError(null);
    try {
      await upsertMeal.mutateAsync({ weekStart: weekStartStr, day: selectedDay, recipeId: recipe.id, mealName: null });
      closeSheet();
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [selectedDay, weekStartStr, upsertMeal, closeSheet]);

  const removeMeal = useCallback(async () => {
    if (!selectedPlan) return;
    setSaving(true);
    setSaveError(null);
    try {
      await deleteMeal.mutateAsync({ id: selectedPlan.id, weekStart: weekStartStr });
      closeSheet();
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Failed to remove');
    } finally {
      setSaving(false);
    }
  }, [selectedPlan, weekStartStr, deleteMeal, closeSheet]);

  const filteredRecipes = useMemo(() => {
    const q = recipeSearch.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter(r => r.name.toLowerCase().includes(q));
  }, [recipes, recipeSearch]);

  const selectedDayDate = selectedDay != null ? addDays(weekStart, selectedDay) : null;
  const sheetDayLabel   = selectedDayDate
    ? selectedDayDate.toLocaleDateString(i18n.language ?? 'en', { weekday: 'long', month: 'short', day: 'numeric' })
    : '';

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16 }}>
        <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 34, color: colors.greenDark, lineHeight: 40 }}>
          {t('plan.title')}
        </Text>
      </View>

      {/* Week navigator */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}>
        <Pressable
          onPress={prevWeek}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.creamCard, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="chevron-back" size={18} color={colors.greenDark} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.green, letterSpacing: 0.5 }}>
            {t('plan.week', { n: weekNum })}
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 1 }}>
            {formatWeekRange(weekStart)}
          </Text>
        </View>
        <Pressable
          onPress={nextWeek}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.creamCard, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="chevron-forward" size={18} color={colors.greenDark} />
        </Pressable>
      </View>

      {/* Random pick button */}
      <Pressable
        onPress={() => setShowWheel(true)}
        style={({ pressed }) => ({
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          gap: 8, marginHorizontal: 16, marginBottom: 12, paddingVertical: 11,
          borderRadius: 14, borderWidth: 1.5, borderColor: colors.green,
          backgroundColor: pressed ? `${colors.green}18` : 'transparent',
        })}>
        <Ionicons name="shuffle" size={16} color={colors.green} />
        <Text style={{ color: colors.green, fontWeight: '700', fontSize: 14 }}>
          {t('plan.random_pick')}
        </Text>
      </Pressable>

      {/* Day list */}
      <ScrollView contentContainerStyle={{ paddingTop: 4, paddingBottom: 32 }}>
        {isLoading ? (
          <ActivityIndicator color={colors.green} style={{ marginTop: 48 }} />
        ) : (
          Array.from({ length: 7 }, (_, i) => (
            <DayCard
              key={i}
              dayIndex={i}
              weekStart={weekStart}
              today={today}
              plan={planByDay[i]}
              onPress={() => openDay(i)}
            />
          ))
        )}
      </ScrollView>

      <WheelModal recipes={recipes} visible={showWheel} onClose={() => setShowWheel(false)} />

      {/* Meal picker sheet */}
      <Modal visible={selectedDay != null} transparent animationType="slide" onRequestClose={closeSheet}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}>
          <Pressable style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={closeSheet}>
            <Pressable style={{ backgroundColor: colors.cream, borderRadius: 24, paddingTop: 12, paddingBottom: 36, maxHeight: '88%' }}>
              {/* Handle */}
              <View style={{ width: 36, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />

              {/* Sheet header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16 }}>
                <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 20, color: colors.greenDark, flex: 1 }} numberOfLines={1}>
                  {sheetDayLabel}
                </Text>
                {selectedPlan && (
                  <Pressable onPress={removeMeal} disabled={saving}>
                    <Text style={{ fontSize: 14, color: colors.dangerText, fontWeight: '600' }}>
                      {t('plan.remove')}
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* Error */}
              {saveError ? (
                <Text style={{ color: colors.dangerText, fontSize: 13, textAlign: 'center', marginBottom: 8, paddingHorizontal: 16 }}>
                  {saveError}
                </Text>
              ) : null}

              {/* Free text input */}
              <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 20 }}>
                <TextInput
                  style={{ flex: 1, backgroundColor: colors.creamCard, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text }}
                  placeholder={t('plan.meal_placeholder')}
                  placeholderTextColor={colors.muted}
                  value={mealInput}
                  onChangeText={setMealInput}
                  returnKeyType="done"
                  onSubmitEditing={saveFreeText}
                  autoCorrect={false}
                />
                <Pressable
                  onPress={saveFreeText}
                  disabled={!mealInput.trim() || saving}
                  style={{
                    backgroundColor: mealInput.trim() ? colors.green : colors.border,
                    borderRadius: 14, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center',
                  }}>
                  {saving ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>{t('common.save')}</Text>
                  )}
                </Pressable>
              </View>

              {/* Recipe picker section */}
              <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
                  {t('plan.pick_recipe')}
                </Text>
                <TextInput
                  style={{ backgroundColor: colors.creamCard, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.text, marginBottom: 10 }}
                  placeholder={t('plan.search_recipes')}
                  placeholderTextColor={colors.muted}
                  value={recipeSearch}
                  onChangeText={setRecipeSearch}
                  autoCorrect={false}
                />
              </View>

              <ScrollView style={{ paddingHorizontal: 16 }} keyboardShouldPersistTaps="handled">
                {filteredRecipes.length === 0 ? (
                  <Text style={{ color: colors.muted, fontSize: 14, textAlign: 'center', marginTop: 12 }}>
                    {t('plan.no_recipes')}
                  </Text>
                ) : (
                  filteredRecipes.map(recipe => (
                    <Pressable
                      key={recipe.id}
                      onPress={() => pickRecipe(recipe)}
                      disabled={saving}
                      style={({ pressed }) => ({
                        flexDirection: 'row', alignItems: 'center', gap: 12,
                        paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border,
                        opacity: pressed ? 0.7 : 1,
                      })}>
                      <RecipeThumb imagePath={recipe.image_path} size={40} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, color: colors.text, fontWeight: '500' }} numberOfLines={1}>
                          {recipe.name}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.muted, marginTop: 1, textTransform: 'capitalize' }}>
                          {recipe.category}
                        </Text>
                      </View>
                      {selectedPlan?.recipe_id === recipe.id && (
                        <Ionicons name="checkmark-circle" size={20} color={colors.green} />
                      )}
                    </Pressable>
                  ))
                )}
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
