import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Pressable 영역에 추가 스타일 (높이·반경 등) */
  buttonStyle?: StyleProp<ViewStyle>;
  /** 기본 pulse, 목업 검색 버튼은 search */
  iconName?: React.ComponentProps<typeof Ionicons>['name'];
};

/**
 * 심장 박동에 가까운, 과하지 않은 펄스(스케일) 애니메이션 CTA
 */
export default function HeartbeatSearchButton({
  label,
  onPress,
  disabled,
  style,
  buttonStyle,
  iconName = 'pulse',
}: Props) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (disabled) {
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 280, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 220, easing: Easing.in(Easing.quad) }),
        withTiming(1.035, { duration: 260, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 520, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [disabled, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.btn,
          buttonStyle,
          disabled && styles.btnDisabled,
          pressed && !disabled && styles.btnPressed,
        ]}
      >
        <Ionicons name={iconName} size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.btnText}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: Colors.primary,
    height: 58,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 6,
  },
  btnDisabled: { backgroundColor: '#D1D5DB', shadowOpacity: 0 },
  btnPressed: { opacity: 0.92 },
  btnText: { fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
});
