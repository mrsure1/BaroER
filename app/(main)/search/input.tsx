// 환자 상태 입력 화면 (S-005) — Phase 3: 위치 자동 감지 + 음성 입력
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
// @react-native-voice/voice는 네이티브 전용이므로 조건부로 가져옵니다.
const Voice = Platform.OS !== 'web' ? require('@react-native-voice/voice').default : null;

import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors';
import { useSearchStore } from '@/src/stores/searchStore';
import { SYMPTOM_OPTIONS, AGE_GROUP_LABELS, CONSCIOUSNESS_LABELS } from '@/src/constants/symptoms';
import { AgeGroup, ConsciousnessLevel, Gender } from '@/src/types';

export default function PatientInputScreen() {
  const router = useRouter();
  const {
    selectedSymptoms, toggleSymptom,
    symptomDetail, setSymptomDetail,
    patientGender, setPatientGender,
    patientAgeGroup, setPatientAgeGroup,
    consciousnessLevel, setConsciousnessLevel,
    userLocation, locationLoading, fetchLocation,
    searchHospitals, isSearching,
  } = useSearchStore();

  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [isListening, setIsListening] = useState(false);

  // 화면 진입 시 위치 자동 감지 및 보이스 리스너 설정
  useEffect(() => {
    if (!userLocation) {
      fetchLocation();
    }

    // 네이티브용 보이스 이벤트 리스너
    if (Platform.OS !== 'web' && Voice) {
      Voice.onSpeechResults = (e: any) => {
        if (e.value && e.value[0]) {
          const transcript = e.value[0];
          setVoiceText(transcript);
          // 실시간으로 텍스트 필드에 바로 입력 (기존 내용 + 인식된 내용)
          setSymptomDetail((prev: string) => prev ? `${prev} ${transcript}`.trim() : transcript);
        }
      };
      
      Voice.onSpeechError = (e: any) => {
        console.error('STT 에러:', e.error);
        setIsListening(false);
      };

      Voice.onSpeechEnd = () => setIsListening(false);
    }

    return () => {
      if (Platform.OS !== 'web' && Voice && typeof Voice.destroy === 'function') {
        Voice.destroy().then(() => {
          if (typeof Voice.removeAllListeners === 'function') {
            Voice.removeAllListeners();
          }
        }).catch(() => {});
      }
    };
  }, []);

  // 음성 입력 시작
  const startVoiceInput = async () => {
    setVoiceModalVisible(true);
    setIsListening(true);
    setVoiceText('');

    // 웹 환경: Web Speech API 사용
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'ko-KR';
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((r: any) => r[0].transcript)
            .join('');
          setVoiceText(transcript);
          // 실시간으로 텍스트 필드에 바로 입력 (기존 내용 + 인식된 내용)
          setSymptomDetail(symptomDetail ? `${symptomDetail} ${transcript}`.trim() : transcript);
        };

        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => {
          setIsListening(false);
          Alert.alert('음성 인식 오류', '마이크 접근이 거부되었거나 인식할 수 없습니다.');
        };

        recognition.start();
        (window as any).__recognition = recognition;
      } else {
        setIsListening(false);
        Alert.alert('미지원', '이 브라우저에서는 음성 인식을 지원하지 않습니다.');
      }
    } else {
      // 네이티브 환경: @react-native-voice/voice 사용
      if (!Voice) {
        // Expo Go 또는 모듈 로드 실패 시 가상 입력 시뮬레이션
        setIsListening(true);
        setTimeout(() => {
          const mockText = "심한 두통과 어지러움이 느껴져요. 혈압이 높은 것 같아요.";
          setVoiceText(mockText);
          setSymptomDetail((prev: string) => prev ? `${prev} ${mockText}`.trim() : mockText);
          setIsListening(false);
          // 팝업으로 안내
          Alert.alert('STT 시뮬레이션', '현재 Expo Go 환경에서는 실제 음성 인식이 지원되지 않아 테스트용 텍스트를 입력했습니다.\n\n실제 기능을 사용하시려면 앱 빌드가 필요합니다.');
        }, 1500);
        return;
      }

      try {
        await Voice.start('ko-KR');
      } catch (e) {
        console.error('음성 인식 시작 실패:', e);
        Alert.alert('오류', '음성 인식을 시작할 수 없습니다. 권한 설정을 확인해 주세요.');
        setIsListening(false);
        setVoiceModalVisible(false);
      }
    }
  };

  // 음성 입력 중지
  const stopVoiceInput = () => {
    setIsListening(false);
    if (Platform.OS === 'web' && (window as any).__recognition) {
      (window as any).__recognition.stop();
    } else {
      Voice.stop();
    }
  };

  // 음성 결과 적용 (이미 실시간 입력되므로 모달 닫기만 수행)
  const applyVoiceResult = () => {
    setVoiceModalVisible(false);
  };

  // 검색 실행
  const handleSearch = async () => {
    if (selectedSymptoms.length === 0) {
      Alert.alert('입력 오류', '하나 이상의 증상을 선택하세요.');
      return;
    }
    if (!patientGender || !patientAgeGroup || !consciousnessLevel) {
      Alert.alert('입력 오류', '환자 정보를 모두 입력하세요.');
      return;
    }
    // API 검색 실행 후 리스트 화면으로 이동
    await searchHospitals();
    router.push('/(main)/search/list');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 위치 정보 */}
      <View style={styles.locationBar}>
        {locationLoading ? (
          <View style={styles.locationRow}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.locationText}>위치 확인 중...</Text>
          </View>
        ) : userLocation ? (
          <View style={styles.locationRow}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationText}>{userLocation.address || '현재 위치 확인됨'}</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.locationRow} onPress={fetchLocation}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={[styles.locationText, { color: Colors.primary }]}>위치 권한 허용하기</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 증상 선택 */}
      <Text style={styles.sectionTitle}>증상 선택 (복수 가능)</Text>
      <View style={styles.chipGrid}>
        {SYMPTOM_OPTIONS.map((opt) => {
          const isSelected = selectedSymptoms.includes(opt.key);
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => toggleSymptom(opt.key)}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {opt.emoji} {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 상세 증상 + 음성 입력 */}
      <Text style={styles.sectionTitle}>상세 증상</Text>
      <View style={styles.detailRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="증상을 상세히 입력하세요..."
          placeholderTextColor={Colors.textLight}
          value={symptomDetail}
          onChangeText={setSymptomDetail}
          multiline
        />
        <TouchableOpacity style={styles.micBtn} onPress={startVoiceInput}>
          <Text style={styles.micEmoji}>🎤</Text>
        </TouchableOpacity>
      </View>

      {/* 환자 정보 */}
      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>환자 정보</Text>

      {/* 성별 */}
      <Text style={styles.fieldLabel}>성별</Text>
      <View style={styles.radioRow}>
        {(['MALE', 'FEMALE'] as Gender[]).map((g) => (
          <TouchableOpacity key={g} style={styles.radioItem} onPress={() => setPatientGender(g)}>
            <View style={[styles.radioCircle, patientGender === g && styles.radioChecked]}>
              {patientGender === g && <View style={styles.radioDot} />}
            </View>
            <Text style={styles.radioLabel}>{g === 'MALE' ? '남성' : '여성'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 연령대 */}
      <Text style={styles.fieldLabel}>연령대</Text>
      <View style={styles.chipGrid}>
        {(Object.entries(AGE_GROUP_LABELS) as [AgeGroup, string][]).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.ageChip, patientAgeGroup === key && styles.chipSelected]}
            onPress={() => setPatientAgeGroup(key)}
          >
            <Text style={[styles.ageChipText, patientAgeGroup === key && styles.chipTextSelected]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 의식 상태 */}
      <Text style={styles.fieldLabel}>의식 상태</Text>
      <View style={styles.radioRow}>
        {(Object.entries(CONSCIOUSNESS_LABELS) as [ConsciousnessLevel, string][]).map(([key, label]) => (
          <TouchableOpacity key={key} style={styles.radioItem} onPress={() => setConsciousnessLevel(key)}>
            <View style={[styles.radioCircle, consciousnessLevel === key && styles.radioChecked]}>
              {consciousnessLevel === key && <View style={styles.radioDot} />}
            </View>
            <Text style={styles.radioLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 검색 버튼 */}
      <TouchableOpacity
        style={[styles.searchBtn, isSearching && { opacity: 0.7 }]}
        onPress={handleSearch}
        disabled={isSearching}
      >
        {isSearching ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.searchBtnText}>검색 중...</Text>
          </View>
        ) : (
          <Text style={styles.searchBtnText}>🔍 응급실 검색</Text>
        )}
      </TouchableOpacity>

      {/* 음성 입력 모달 */}
      <Modal visible={voiceModalVisible} transparent animationType="fade">
        <View style={styles.voiceOverlay}>
          <View style={styles.voiceModal}>
            <Text style={styles.voiceMic}>{isListening ? '🔴' : '🎤'}</Text>
            <Text style={styles.voiceTitle}>
              {isListening ? '듣고 있습니다...' : '음성 인식 완료'}
            </Text>
            {voiceText ? (
              <View style={styles.voiceTranscript}>
                <Text style={styles.voiceTranscriptText}>{voiceText}</Text>
              </View>
            ) : isListening ? (
              <Text style={styles.voiceHint}>환자 증상을 말씀해주세요</Text>
            ) : null}
            <View style={styles.voiceActions}>
              {isListening ? (
                <TouchableOpacity style={styles.voiceStopBtn} onPress={stopVoiceInput}>
                  <Text style={styles.voiceStopBtnText}>⏹️ 중지</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity style={styles.voiceRetryBtn} onPress={startVoiceInput}>
                    <Text style={styles.voiceRetryBtnText}>🔄 다시</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.voiceApplyBtn} onPress={applyVoiceResult}>
                    <Text style={styles.voiceApplyBtnText}>✅ 적용</Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity
                style={styles.voiceCancelBtn}
                onPress={() => { stopVoiceInput(); setVoiceModalVisible(false); }}
              >
                <Text style={styles.voiceCancelBtnText}>취소</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, paddingBottom: 40 },
  locationBar: {
    backgroundColor: Colors.badgeBlue, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.xl,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationIcon: { fontSize: 16 },
  locationText: { fontSize: FontSize.sm, color: Colors.text },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text, marginBottom: Spacing.md },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.xl },
  chip: {
    paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  chipSelected: { borderColor: Colors.primary, backgroundColor: '#FFF3F0' },
  chipText: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: '500' },
  chipTextSelected: { color: Colors.primary, fontWeight: '600' },
  detailRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.xl },
  input: {
    backgroundColor: Colors.inputBg, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md, padding: 14, fontSize: FontSize.md, color: Colors.text, minHeight: 48,
  },
  micBtn: {
    width: 48, height: 48, backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center',
  },
  micEmoji: { fontSize: 22 },
  divider: { height: 1, backgroundColor: Colors.divider, marginBottom: Spacing.xl },
  fieldLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 8 },
  radioRow: { flexDirection: 'row', gap: 16, marginBottom: Spacing.xl },
  radioItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  radioCircle: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioChecked: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  radioLabel: { fontSize: FontSize.md, color: Colors.text },
  ageChip: {
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: BorderRadius.sm, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background,
  },
  ageChipText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  searchBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    padding: 16, alignItems: 'center', marginTop: Spacing.lg,
  },
  searchBtnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '700' },
  // 음성 모달
  voiceOverlay: {
    flex: 1, backgroundColor: Colors.overlay,
    alignItems: 'center', justifyContent: 'center',
  },
  voiceModal: {
    backgroundColor: '#fff', borderRadius: 20, padding: 30,
    width: '85%', alignItems: 'center',
  },
  voiceMic: { fontSize: 48, marginBottom: 12 },
  voiceTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  voiceHint: { fontSize: FontSize.sm, color: Colors.textSecondary },
  voiceTranscript: {
    backgroundColor: Colors.inputBg, borderRadius: BorderRadius.md,
    padding: 14, marginVertical: 14, width: '100%',
  },
  voiceTranscriptText: { fontSize: FontSize.md, color: Colors.text, lineHeight: 22 },
  voiceActions: { flexDirection: 'row', gap: 10, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' },
  voiceStopBtn: { backgroundColor: Colors.full, borderRadius: BorderRadius.md, paddingHorizontal: 20, paddingVertical: 10 },
  voiceStopBtnText: { color: '#fff', fontWeight: '600' },
  voiceRetryBtn: { backgroundColor: Colors.badgeBlue, borderRadius: BorderRadius.md, paddingHorizontal: 16, paddingVertical: 10 },
  voiceRetryBtnText: { color: Colors.secondary, fontWeight: '600' },
  voiceApplyBtn: { backgroundColor: Colors.available, borderRadius: BorderRadius.md, paddingHorizontal: 20, paddingVertical: 10 },
  voiceApplyBtnText: { color: '#fff', fontWeight: '600' },
  voiceCancelBtn: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: 16, paddingVertical: 10 },
  voiceCancelBtnText: { color: Colors.textSecondary },
});
