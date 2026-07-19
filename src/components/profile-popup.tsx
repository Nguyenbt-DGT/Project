import { useEffect, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useCurrentUser, useProfile, useSignOut, useUpdateProfile } from '@/hooks/use-current-user';
import { useLanguage } from '@/i18n';
import { COLORS, RADIUS, SPACING } from '@/theme';

interface ProfilePopupProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * The cross-tab profile popup (DEMO_FEEDBACK_005 #5 — "displayed through all the tabs"). Triggered
 * from a header button shared by every screen inside `app/(tabs)/_layout.tsx`. Shows the signed-in
 * user's email, an editable display name backed by the `profiles` table (#4,
 * `20260719090000_create_profiles.sql`), and a sign-out action.
 */
export function ProfilePopup({ visible, onClose }: ProfilePopupProps) {
  const { language } = useLanguage();
  const { data: user } = useCurrentUser();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const signOut = useSignOut();

  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');

  // Reset the edit buffer whenever the popup opens or the stored name changes underneath it.
  useEffect(() => {
    if (visible) {
      setNameInput(profile?.display_name ?? '');
      setIsEditing(false);
    }
  }, [visible, profile?.display_name]);

  if (!visible) return null;

  const title = language === 'vi' ? 'Hồ sơ' : 'Profile';
  const signOutLabel = language === 'vi' ? 'Đăng xuất' : 'Sign out';
  const editLabel = language === 'vi' ? 'Sửa tên' : 'Edit name';
  const saveLabel = language === 'vi' ? 'Lưu' : 'Save';
  const namePlaceholder = language === 'vi' ? 'Tên hiển thị' : 'Display name';
  const noNameLabel = language === 'vi' ? 'Chưa đặt tên' : 'No name set';

  const handleSignOut = () => {
    void (async () => {
      await signOut();
      onClose();
      router.replace('/(auth)/sign-in');
    })();
  };

  const handleSaveName = () => {
    void updateProfile.mutateAsync(nameInput).then(() => setIsEditing(false));
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        {/* Swallow taps inside the card so they don't bubble to the overlay's dismiss handler. */}
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} accessibilityRole="button" hitSlop={8}>
              <Ionicons name="close" size={20} color={COLORS.inkMuted} />
            </Pressable>
          </View>

          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color={COLORS.accent} />
          </View>

          {isEditing ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.nameInput}
                value={nameInput}
                onChangeText={setNameInput}
                placeholder={namePlaceholder}
                placeholderTextColor={COLORS.inkFaint}
                autoFocus
              />
              <Pressable
                style={styles.saveButton}
                onPress={handleSaveName}
                disabled={updateProfile.isPending}
                accessibilityRole="button"
              >
                <Text style={styles.saveButtonText}>{saveLabel}</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => setIsEditing(true)} accessibilityRole="button">
              <Text style={styles.name}>{profile?.display_name || noNameLabel}</Text>
              <Text style={styles.editHint}>{editLabel}</Text>
            </Pressable>
          )}

          <Text style={styles.email}>{user?.email ?? '—'}</Text>

          <Pressable
            style={styles.signOutButton}
            onPress={handleSignOut}
            accessibilityRole="button"
          >
            <Text style={styles.signOutText}>{signOutLabel}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'flex-end',
    padding: SPACING.lg,
  },
  card: {
    marginTop: 48,
    width: 240,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  title: {
    color: COLORS.ink,
    fontWeight: '700',
    fontSize: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    color: COLORS.ink,
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
  },
  editHint: {
    color: COLORS.accent,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  editRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: SPACING.xs,
    alignItems: 'center',
  },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    fontSize: 13,
    color: COLORS.ink,
    backgroundColor: COLORS.surfaceMuted,
  },
  saveButton: {
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  saveButtonText: {
    color: COLORS.accent,
    fontWeight: '700',
    fontSize: 12,
  },
  email: {
    color: COLORS.inkMuted,
    fontSize: 13,
  },
  signOutButton: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: COLORS.accentStrong,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  signOutText: {
    color: COLORS.accentStrong,
    fontWeight: '700',
    fontSize: 13,
  },
});
