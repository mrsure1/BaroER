import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
  Alert,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import Voice from '@react-native-voice/voice';
import { Colors } from '@/constants/Colors';
import NavigationHeader from '@/components/common/NavigationHeader';
import HeartbeatSearchButton from '@/components/HeartbeatSearchButton';
import { AGE_GROUP_LABELS, SYMPTOM_OPTIONS } from '@/src/constants/symptoms';
import { AgeGroup, ConsciousnessLevel, Gender, SymptomCategory } from '@/src/types';
import { useSearchStore } from '@/src/stores/searchStore';

const AGE_ORDER: AgeGroup[] = ['INFANT', 'CHILD', 'ADULT', 'ELDERLY'];

const CONSCIOUSNESS_OPTIONS: { key: ConsciousnessLevel; label: string }[] = [
  { key: 'ALERT', label: '명료' },
  { key: 'DROWSY', label: '혼미' },
  { key: 'UNRESPONSIVE', label: '무반응' },
];

export default function SearchInputScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setFilters, searchHospitals } = useSearchStore();

  const [detailText, setDetailText] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomCategory[]>([]);
  const [gender, setGender] = useState<Gender>('MALE');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('ADULT');
  const [consciousness, setConsciousness] = useState<ConsciousnessLevel>('ALERT');
  const [ageModalVisible, setAgeModalVisible] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);

  const handleSymptomToggle = (symptom: SymptomCategory) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  useEffect(() => {
    Voice.onSpeechResults = (e) => {
      const t = e.value?.[0];
      if (t) {
        setDetailText((prev) => (prev ? `${prev} ${t}` : t));
      }
    };
    Voice.onSpeechError = () => {
      setVoiceListening(false);
    };
    Voice.onSpeechEnd = () => {
      setVoiceListening(false);
    };
    return () => {
      void Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const toggleVoice = useCallback(async () => {
    try {
      if (voiceListening) {
        await Voice.stop();
        setVoiceListening(false);
        return;
      }
      await Voice.start('ko-KR');
      setVoiceListening(true);
    } catch {
      Alert.alert('음성 입력', '마이크 권한 또는 음성 인식을 사용할 수 없습니다.');
      setVoiceListening(false);
    }
  }, [voiceListening]);

  const handleSearch = async () => {
    setFilters({
      query: detailText,
      symptoms: selectedSymptoms,
      patientGender: gender,
      patientAgeGroup: ageGroup,
      consciousnessLevel: consciousness,
    });
    await searchHospitals();
    router.push('/(main)/search/list');
  };

  const canSearch = selectedSymptoms.length > 0 || detailText.trim().length > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="light" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          <NavigationHeader title="환자 상태 입력" showBack variant="primary" />

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.card}>
              <Text style={styles.cardTitle}>증상 선택</Text>
              <Text style={styles.cardHint}>복수 선택 가능</Text>
              <View style={styles.symptomGrid}>
                {SYMPTOM_OPTIONS.map((symptom) => {
                  const isSelected = selectedSymptoms.includes(symptom.key);
                  return (
                    <TouchableOpacity
                      key={symptom.key}
                      style={[styles.symptomChip, isSelected && styles.symptomChipSelected]}
                      onPress={() => handleSymptomToggle(symptom.key)}
                      activeOpacity={0.88}
                    >
                      <View style={[styles.iconRing, isSelected && styles.iconRingOn]}>
                        <Ionicons
                          name={symptom.iconName}
                          size={20}
                          color={isSelected ? Colors.primary : '#8E8E93'}
                        />
                      </View>
                      <Text style={[styles.symptomLabel, isSelected && styles.symptomLabelSelected]} numberOfLines={1}>
                        {symptom.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>상세 증상</Text>
              <View style={styles.detailRow}>
                <TextInput
                  style={styles.detailInput}
                  placeholder="증상을 상세히 입력하세요..."
                  placeholderTextColor="#ADB5BD"
                  value={detailText}
                  onChangeText={setDetailText}
                  multiline
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={[styles.micBtn, voiceListening && styles.micBtnActive]}
                  onPress={toggleVoice}
                  activeOpacity={0.88}
                  accessibilityLabel="음성 입력"
                >
                  <Ionicons name={voiceListening ? 'stop' : 'mic'} size={22} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>환자 정보</Text>

              <View style={styles.twoCol}>
                <View style={styles.col}>
                  <Text style={styles.fieldMini}>성별</Text>
                  <View style={styles.segmentRow}>
                    {(['MALE', 'FEMALE'] as const).map((g) => {
                      const on = gender === g;
                      return (
                        <TouchableOpacity
                          key={g}
                          style={[styles.segment, on && styles.segmentOn]}
                          onPress={() => setGender(g)}
                          activeOpacity={0.85}
                        >
                          <Text style={[styles.segmentText, on && styles.segmentTextOn]}>
                            {g === 'MALE' ? '남성' : '여성'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
                <View style={styles.col}>
                  <Text style={styles.fieldMini}>연령대</Text>
                  <Pressable style={styles.ageBox} onPress={() => setAgeModalVisible(true)}>
                    <Text style={styles.ageBoxText} numberOfLines={1}>
                      {AGE_GROUP_LABELS[ageGroup]}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={Colors.textSecondary} />
                  </Pressable>
                </View>
              </View>

              <Text style={[styles.fieldMini, styles.fieldMiniSpaced]}>의식 상태</Text>
              <View style={styles.consciousRow}>
                {CONSCIOUSNESS_OPTIONS.map((c) => {
                  const on = consciousness === c.key;
                  return (
                    <TouchableOpacity
                      key={c.key}
                      style={[styles.consciousPill, on && styles.consciousPillOn]}
                      onPress={() => setConsciousness(c.key)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.consciousText, on && styles.consciousTextOn]}>{c.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            <HeartbeatSearchButton
              label="응급실 검색"
              iconName="search"
              onPress={handleSearch}
              disabled={!canSearch}
              buttonStyle={styles.ctaCompact}
            />
          </View>

          <Modal visible={ageModalVisible} transparent animationType="fade" onRequestClose={() => setAgeModalVisible(false)}>
            <Pressable style={styles.modalOverlay} onPress={() => setAgeModalVisible(false)}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>연령대 선택</Text>
                {AGE_ORDER.map((ag) => (
                  <TouchableOpacity
                    key={ag}
                    style={[styles.modalRow, ageGroup === ag && styles.modalRowOn]}
                    onPress={() => {
                      setAgeGroup(ag);
                      setAgeModalVisible(false);
                    }}
                  >
                    <Text style={[styles.modalRowText, ageGroup === ag && styles.modalRowTextOn]}>
                      {AGE_GROUP_LABELS[ag]}
                    </Text>
                    {ageGroup === ag ? <Ionicons name="checkmark" size={20} color={Colors.primary} /> : null}
                  </TouchableOpacity>
                ))}
              </View>
            </Pressable>
          </Modal>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F5F7' },
  inner: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    flexGrow: 1,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: { elevation: 1 },
    }),
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#495057',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  cardHint: {
    fontSize: 11,
    color: '#868E96',
    marginTop: 2,
    marginBottom: 10,
    fontWeight: '500',
  },

  symptomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  symptomChip: {
    width: '33.333%',
    paddingHorizontal: 4,
    marginBottom: 8,
    alignItems: 'center',
  },
  symptomChipSelected: {},
  iconRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F3F5',
    borderWidth: 1.5,
    borderColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconRingOn: {
    backgroundColor: '#FFF5F5',
    borderColor: Colors.primary,
  },
  symptomLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#343A40',
    textAlign: 'center',
  },
  symptomLabelSelected: { color: Colors.primary },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
    marginTop: 8,
  },
  detailInput: {
    flex: 1,
    minHeight: 48,
    maxHeight: 64,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
    backgroundColor: '#FAFBFC',
  },
  micBtn: {
    width: 48,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  micBtnActive: { backgroundColor: Colors.primaryDark },

  twoCol: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  col: { flex: 1 },
  fieldMini: {
    fontSize: 11,
    fontWeight: '700',
    color: '#868E96',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  fieldMiniSpaced: { marginTop: 10 },
  segmentRow: {
    flexDirection: 'row',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#FAFBFC',
  },
  segmentOn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  segmentText: { fontSize: 13, fontWeight: '700', color: '#495057' },
  segmentTextOn: { color: '#fff' },

  ageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#FAFBFC',
    gap: 4,
  },
  ageBoxText: { flex: 1, fontSize: 12, fontWeight: '600', color: Colors.text },

  consciousRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  consciousPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    backgroundColor: '#FAFBFC',
    alignItems: 'center',
  },
  consciousPillOn: {
    borderColor: Colors.primary,
    backgroundColor: '#FFF5F5',
  },
  consciousText: { fontSize: 12, fontWeight: '700', color: '#495057' },
  consciousTextOn: { color: Colors.primary },

  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: '#F4F5F7',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#DEE2E6',
  },
  ctaCompact: {
    height: 52,
    borderRadius: 14,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 8,
    maxHeight: 360,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
    color: Colors.text,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modalRowOn: { backgroundColor: '#FFF5F5' },
  modalRowText: { fontSize: 16, color: '#212529' },
  modalRowTextOn: { color: Colors.primary, fontWeight: '700' },
});
