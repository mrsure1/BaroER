import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import Svg, { Path } from 'react-native-svg';

interface Props {
  beds: number;
  status: 'AVAILABLE' | 'BUSY' | 'FULL';
}

/**
 * 시안 1번 스타일의 커스텀 지도 마커
 * 상태별 색상 핀 + 중앙 병상 수 표시
 */
export const HospitalMapMarker = ({ beds, status }: Props) => {
  const color = status === 'AVAILABLE' ? Colors.available : (status === 'BUSY' ? Colors.busy : Colors.full);

  return (
    <View style={styles.container}>
      {/* 핀 몸체 (말풍선 꼬리 형태) */}
      <Svg height="46" width="40" viewBox="0 0 24 30">
        <Path
          d="M12 0C5.37 0 0 5.37 0 12c0 9 12 18 12 18s12-9 12-18c0-6.63-5.37-12-12-12z"
          fill={color}
          stroke="#fff"
          strokeWidth="1.5"
        />
      </Svg>
      
      {/* 병상 수 숫자 */}
      <View style={styles.bubble}>
        <Text style={styles.text}>{beds}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 46,
  },
  bubble: {
    position: 'absolute',
    top: 5,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    paddingHorizontal: 4,
    minWidth: 20,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 9,
    fontWeight: '900',
    color: '#333',
  },
});
