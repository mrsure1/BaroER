// 검색 탭 레이아웃 - 스택 네비게이터
import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function SearchLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="input" options={{ title: '환자 상태 입력' }} />
      <Stack.Screen name="map" options={{ title: '응급실 검색' }} />
      <Stack.Screen name="list" options={{ title: '응급실 검색' }} />
    </Stack>
  );
}
