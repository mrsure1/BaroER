// 앱 진입점 - 인증 상태에 따라 라우팅 가드가 처리하므로 빈 리디렉트
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/src/stores/authStore';

export default function Index() {
  const { isLoggedIn } = useAuthStore();

  if (isLoggedIn) {
    return <Redirect href="/(main)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
