// 메인 그룹 레이아웃 - 하단 탭 네비게이션
import { Tabs } from 'expo-router';
import { Colors } from '@/constants/Colors';

import { useAuthStore } from '@/src/stores/authStore';

export default function MainLayout() {
  const { user } = useAuthStore();
  const isParamedicOrAdmin = user?.userType === 'PARAMEDIC' || user?.isAdmin;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.divider,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 6,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: '검색',
          tabBarIcon: ({ color }) => <TabIcon emoji="🗺️" color={color} />,
        }}
      />
      <Tabs.Screen
        name="dispatch"
        options={{
          title: '기록',
          tabBarIcon: ({ color }) => <TabIcon emoji="📋" color={color} />,
          href: isParamedicOrAdmin ? '/dispatch' : null, // 구급대원/어드민만 접근 가능
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '설정',
          tabBarIcon: ({ color }) => <TabIcon emoji="⚙️" color={color} />,
        }}
      />
    </Tabs>
  );
}

// 이모지 탭 아이콘 컴포넌트
import { Text } from 'react-native';
function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  return <Text style={{ fontSize: 22 }}>{emoji}</Text>;
}
