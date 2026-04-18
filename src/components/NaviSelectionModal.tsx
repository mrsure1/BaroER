import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface NaviSelectionModalProps {
  isVisible: boolean;
  onClose: () => void;
  hospitalName: string;
  lat: number;
  lng: number;
  address?: string;
}

export default function NaviSelectionModal({ isVisible, onClose, hospitalName, lat, lng }: NaviSelectionModalProps) {
  
  const openNaviApp = (type: 'kakao' | 'naver' | 'tmap') => {
    let url = '';
    
    if (type === 'kakao') {
      url = `kakaomap://route?ep=${lat},${lng}&by=CAR`;
    } else if (type === 'naver') {
      url = `nmap://route/car?dlat=${lat}&dlng=${lng}&dname=${hospitalName}`;
    } else if (type === 'tmap') {
      url = `tmap://route?goalname=${hospitalName}&goalx=${lng}&goaly=${lat}`;
    }

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // 앱이 없을 경우 앱스토어로 이동하거나 웹 브라우저로 열기 등의 처리 필요
        if (type === 'kakao') {
          Linking.openURL(Platform.OS === 'ios' ? 'https://apps.apple.com/app/id304608425' : 'market://details?id=net.daum.android.map');
        } else if (type === 'naver') {
          Linking.openURL(Platform.OS === 'ios' ? 'https://apps.apple.com/app/id311867728' : 'market://details?id=com.nhn.android.nmap');
        } else if (type === 'tmap') {
            Linking.openURL(Platform.OS === 'ios' ? 'https://apps.apple.com/app/id431589174' : 'market://details?id=com.skt.tmap.ku');
        }
      }
    }).catch(err => console.error('An error occurred', err));
    
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>길안내 앱 선택</Text>
          <Text style={styles.subtitle}>{hospitalName}까지 길안내를 시작합니다.</Text>
          
          <View style={styles.appContainer}>
            <TouchableOpacity style={styles.appBtn} onPress={() => openNaviApp('kakao')}>
              <View style={[styles.iconBox, { backgroundColor: '#FEE500' }]}>
                <Ionicons name="map" size={24} color="#000" />
              </View>
              <Text style={styles.appName}>카카오맵</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.appBtn} onPress={() => openNaviApp('naver')}>
              <View style={[styles.iconBox, { backgroundColor: '#03C75A' }]}>
                <Ionicons name="map" size={24} color="#fff" />
              </View>
              <Text style={styles.appName}>네이버지도</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.appBtn} onPress={() => openNaviApp('tmap')}>
              <View style={[styles.iconBox, { backgroundColor: '#FF0000' }]}>
                <Ionicons name="navigate" size={24} color="#fff" />
              </View>
              <Text style={styles.appName}>T맵</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>취소</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  appContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  appBtn: {
    alignItems: 'center',
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  appName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  closeBtn: {
    backgroundColor: '#F1F3F5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
});
