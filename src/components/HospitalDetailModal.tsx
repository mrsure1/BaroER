import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Hospital } from '@/src/types';

interface HospitalDetailModalProps {
  isVisible: boolean;
  onClose: () => void;
  hospital: Hospital;
  onNavigate: () => void;
}

export default function HospitalDetailModal({ isVisible, onClose, hospital, onNavigate }: HospitalDetailModalProps) {
  if (!hospital) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>{hospital.name}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.body}>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.infoText}>{hospital.address}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.infoText}>{hospital.phone || '전화번호 정보 없음'}</Text>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>거리 · 도착 예상</Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  {hospital.distanceKm ?? '-'}km · 차량 {hospital.etaMin ?? '-'}분
                </Text>
                <Text style={styles.metaHint}>
                  {hospital.routeSource === 'naver_traffic'
                    ? '네이버 경로(실시간 교통 반영)'
                    : '직선 거리 기준 추정'}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>병상 현황</Text>
              <View style={styles.bedBox}>
                <Text style={styles.bedText}>
                  가용 병상: {hospital.availableBeds} / {hospital.totalBeds}
                </Text>
                <Text
                  style={[
                    styles.statusTag,
                    hospital.status === 'FULL' ? styles.statusFull : styles.statusAvailable,
                  ]}
                >
                  {hospital.status === 'FULL' ? '진료 불가' : hospital.status === 'BUSY' ? '혼잡' : '진료 가능'}
                </Text>
              </View>
            </View>

            {hospital.seriousDiseases && hospital.seriousDiseases.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>중증 질환 대응</Text>
                <View style={styles.tagContainer}>
                  {hospital.seriousDiseases.map((d, i) => (
                    <View key={i} style={styles.tag}>
                      <Text style={styles.tagText}>{d}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={onClose}>
              <Text style={[styles.btnText, styles.cancelBtnText]}>닫기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.primaryBtn]} onPress={onNavigate}>
              <Text style={[styles.btnText, styles.primaryBtnText]}>길안내 시작</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '50%',
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 15,
    color: Colors.textSecondary,
    flex: 1,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  metaRow: {
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 12,
    gap: 4,
  },
  metaText: { fontSize: 15, fontWeight: '700', color: Colors.text },
  metaHint: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  bedBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  bedText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  statusTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: '700',
  },
  statusAvailable: {
    backgroundColor: '#EBFBEE',
    color: '#2B8A3E',
  },
  statusFull: {
    backgroundColor: '#FFF5F5',
    color: '#E03131',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#F1F3F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 40,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
  },
  btn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F1F3F5',
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  cancelBtnText: {
    color: Colors.textSecondary,
  },
  primaryBtnText: {
    color: '#fff',
  },
});
