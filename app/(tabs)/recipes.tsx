import { View, Text } from 'react-native';
import { Colors } from '@/constants/colors';

export default function RecipesScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 28, color: Colors.greenDark }}>
        Recept
      </Text>
      <Text style={{ fontSize: 14, color: Colors.muted, marginTop: 8 }}>Kommer snart</Text>
    </View>
  );
}
