import React, { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Text, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  getPlayerInfo,
  setPlayerInfo,
  clearPlayerInfo,
} from "../../utils/storage";
import { router } from "expo-router";

export default function ProfileScreen() {
  const [username, setUsername] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [avatarColor, setAvatarColor] = useState("#6366F1");

  useEffect(() => {
    const loadPlayerInfo = async () => {
      const playerInfo = await getPlayerInfo();
      if (playerInfo) {
        setUsername(playerInfo.username);
      }
    };

    loadPlayerInfo();
  }, []);

  const handleUpdateProfile = async () => {
    if (username.length < 3 || username.length > 12) {
      Alert.alert(
        "Invalid Username",
        "Username must be between 3 and 12 characters long."
      );
      return;
    }

    const playerInfo = await getPlayerInfo();
    if (playerInfo) {
      await setPlayerInfo({
        ...playerInfo,
        username,
      });
      setIsEditing(false);
      Alert.alert("Success", "Your profile has been updated.");
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout? This will clear your player data.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          onPress: async () => {
            await clearPlayerInfo();
            router.replace("/");
          },
          style: "destructive",
        },
      ]
    );
  };

  const colorOptions = [
    "#6366F1", // Indigo
    "#EC4899", // Pink
    "#10B981", // Emerald
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#8B5CF6", // Violet
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>
            {username.charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.title}>
          {isEditing ? "Edit Profile" : "Your Profile"}
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          {!isEditing && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="pencil" size={16} color="#6366F1" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Username</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your username"
              maxLength={12}
              autoCapitalize="none"
              autoCorrect={false}
            />
          ) : (
            <Text style={styles.value}>{username}</Text>
          )}
        </View>

        {isEditing && (
          <>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Avatar Color</Text>
              <View style={styles.colorPicker}>
                {colorOptions.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      avatarColor === color && styles.selectedColor,
                    ]}
                    onPress={() => setAvatarColor(color)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.button}
                onPress={handleUpdateProfile}
              >
                <Text style={styles.buttonText}>Save Changes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsEditing(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>

        <TouchableOpacity style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="notifications-outline" size={24} color="#4B5563" />
            <Text style={styles.settingText}>Notifications</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="volume-high-outline" size={24} color="#4B5563" />
            <Text style={styles.settingText}>Sound Effects</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="moon-outline" size={24} color="#4B5563" />
            <Text style={styles.settingText}>Dark Mode</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>

        <TouchableOpacity style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="help-circle-outline" size={24} color="#4B5563" />
            <Text style={styles.settingText}>Help & FAQ</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="paper-plane-outline" size={24} color="#4B5563" />
            <Text style={styles.settingText}>Contact Us</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="document-text-outline" size={24} color="#4B5563" />
            <Text style={styles.settingText}>Terms & Privacy</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.version}>Pictionary Pals v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  section: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButtonText: {
    fontSize: 14,
    color: "#6366F1",
    fontWeight: "500",
    marginLeft: 4,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  value: {
    fontSize: 16,
    color: "#111827",
  },
  colorPicker: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginHorizontal: 4,
  },
  selectedColor: {
    borderWidth: 2,
    borderColor: "#111827",
  },
  buttonContainer: {
    marginTop: 8,
  },
  button: {
    backgroundColor: "#6366F1",
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  cancelButton: {
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  cancelButtonText: {
    color: "#4B5563",
    fontWeight: "600",
    fontSize: 16,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingText: {
    fontSize: 16,
    color: "#4B5563",
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
    padding: 16,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  logoutText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  footer: {
    alignItems: "center",
    marginTop: 12,
    marginBottom: 40,
  },
  version: {
    fontSize: 14,
    color: "#9CA3AF",
  },
});
