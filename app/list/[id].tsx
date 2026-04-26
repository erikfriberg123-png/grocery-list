import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function ListDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-lg">List {id}</Text>
    </View>
  );
}
