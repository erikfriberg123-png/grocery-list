import { View, Text, Pressable } from 'react-native';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/src/features/auth/use-auth';

export default function HouseholdScreen() {
  const { user, signOut } = useAuth();
  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontFamily: 'CormorantGaramond_500Medium', fontSize: 32, color: Colors.greenDark, marginBottom: 8 }}>
        Hushåll
      </Text>
      {user && (
        <Text style={{ fontSize: 14, color: Colors.muted, marginBottom: 32 }}>{user.email}</Text>
      )}
      <Pressable
        onPress={signOut}
        style={{ backgroundColor: Colors.greenLight, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}>
        <Text style={{ color: Colors.greenDark, fontWeight: '600', fontSize: 15 }}>Logga ut</Text>
      </Pressable>
    </View>
  );
}
