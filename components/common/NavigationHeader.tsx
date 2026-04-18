import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize } from '@/constants/Colors';

interface NavigationHeaderProps {
  title: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
  /** 빨간 배경 + 흰 글씨 (목업 헤더) */
  variant?: 'default' | 'primary';
}

const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  title,
  showBack = false,
  rightElement,
  variant = 'default',
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isPrimary = variant === 'primary';

  return (
    <View
      style={[
        styles.container,
        isPrimary && {
          backgroundColor: Colors.primary,
          borderBottomWidth: 0,
          paddingTop: insets.top,
          minHeight: 56 + insets.top,
        },
      ]}
    >
      <View style={styles.leftSection}>
        {showBack && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={isPrimary ? '#fff' : Colors.text} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.titleSection}>
        <Text style={[styles.title, isPrimary && styles.titlePrimary]} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <View style={styles.rightSection}>{rightElement}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border || '#EEEEEE',
    paddingTop: 10,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  titleSection: {
    flex: 3,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: FontSize.lg || 18,
    fontWeight: 'bold',
    color: Colors.text || '#000000',
  },
  titlePrimary: {
    color: '#fff',
    fontWeight: '700',
  },
  backButton: {
    padding: 4,
  },
});

export default NavigationHeader;
