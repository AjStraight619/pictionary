import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Player {
  id: string;
  username: string;
  score: number;
  isReady: boolean;
  isHost: boolean;
}

interface GameOptions {
  roundTime: number;
  rounds: number;
  language: string;
}

interface GameLobbyProps {
  gameId: string;
  players: Player[];
  currentPlayerId: string;
  gameOptions: GameOptions;
  onReady: () => void;
  onStartGame: () => void;
  onUpdateOptions: (options: Partial<GameOptions>) => void;
  onLeaveGame: () => void;
}

const GameLobby: React.FC<GameLobbyProps> = ({
  gameId,
  players,
  currentPlayerId,
  gameOptions,
  onReady,
  onStartGame,
  onUpdateOptions,
  onLeaveGame,
}) => {
  const [showOptions, setShowOptions] = useState(false);

  const currentPlayer = players.find((player) => player.id === currentPlayerId);
  const isHost = currentPlayer?.isHost || false;
  const isReady = currentPlayer?.isReady || false;
  const allPlayersReady =
    players.length > 1 && players.every((player) => player.isReady);

  const shareGameLink = () => {
    Alert.alert("Share Game Code", `Share this code with friends: ${gameId}`, [
      { text: "Copy", onPress: () => {} }, // Would normally copy to clipboard
      { text: "Close" },
    ]);
  };

  const renderPlayerItem = ({ item }: { item: Player }) => (
    <View style={styles.playerItem}>
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>
          {item.username} {item.isHost && "(Host)"}
        </Text>
        <Text style={styles.playerScore}>{item.score} pts</Text>
      </View>
      <View
        style={[
          styles.statusIndicator,
          item.isReady ? styles.readyStatus : styles.notReadyStatus,
        ]}
      >
        <Text style={styles.statusText}>
          {item.isReady ? "Ready" : "Not Ready"}
        </Text>
      </View>
    </View>
  );

  const renderGameOptions = () => (
    <View style={styles.optionsContainer}>
      <Text style={styles.optionsTitle}>Game Options</Text>

      <View style={styles.optionRow}>
        <Text style={styles.optionLabel}>Round Time</Text>
        <View style={styles.optionControls}>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() =>
              onUpdateOptions({
                roundTime: Math.max(30, gameOptions.roundTime - 30),
              })
            }
            disabled={!isHost}
          >
            <Text style={styles.optionButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.optionValue}>{gameOptions.roundTime}s</Text>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() =>
              onUpdateOptions({
                roundTime: Math.min(300, gameOptions.roundTime + 30),
              })
            }
            disabled={!isHost}
          >
            <Text style={styles.optionButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.optionRow}>
        <Text style={styles.optionLabel}>Rounds</Text>
        <View style={styles.optionControls}>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() =>
              onUpdateOptions({ rounds: Math.max(1, gameOptions.rounds - 1) })
            }
            disabled={!isHost}
          >
            <Text style={styles.optionButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.optionValue}>{gameOptions.rounds}</Text>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() =>
              onUpdateOptions({ rounds: Math.min(10, gameOptions.rounds + 1) })
            }
            disabled={!isHost}
          >
            <Text style={styles.optionButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.optionRow}>
        <Text style={styles.optionLabel}>Language</Text>
        <View style={styles.languageContainer}>
          <TouchableOpacity
            style={[
              styles.languageButton,
              gameOptions.language === "en" && styles.selectedLanguage,
            ]}
            onPress={() => onUpdateOptions({ language: "en" })}
            disabled={!isHost}
          >
            <Text style={styles.languageText}>English</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.languageButton,
              gameOptions.language === "es" && styles.selectedLanguage,
            ]}
            onPress={() => onUpdateOptions({ language: "es" })}
            disabled={!isHost}
          >
            <Text style={styles.languageText}>Spanish</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.languageButton,
              gameOptions.language === "fr" && styles.selectedLanguage,
            ]}
            onPress={() => onUpdateOptions({ language: "fr" })}
            disabled={!isHost}
          >
            <Text style={styles.languageText}>French</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!isHost && (
        <Text style={styles.hostOnlyMessage}>
          Only the host can modify game settings
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Game Lobby</Text>
        <TouchableOpacity style={styles.shareButton} onPress={shareGameLink}>
          <Ionicons name="share-outline" size={24} color="#007AFF" />
          <Text style={styles.shareText}>Share</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.gameInfo}>
        <Text style={styles.gameIdLabel}>
          Game ID: <Text style={styles.gameId}>{gameId}</Text>
        </Text>
        <Text style={styles.playersCount}>Players: {players.length}/8</Text>
      </View>

      <FlatList
        data={players}
        renderItem={renderPlayerItem}
        keyExtractor={(item) => item.id}
        style={styles.playersList}
        ListHeaderComponent={
          <Text style={styles.playersListHeader}>Players</Text>
        }
      />

      <TouchableOpacity
        style={styles.optionsToggle}
        onPress={() => setShowOptions(!showOptions)}
      >
        <Text style={styles.optionsToggleText}>
          {showOptions ? "Hide Options" : "Show Options"}
        </Text>
        <Ionicons
          name={showOptions ? "chevron-up" : "chevron-down"}
          size={18}
          color="#007AFF"
        />
      </TouchableOpacity>

      {showOptions && renderGameOptions()}

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.leaveButton]}
          onPress={onLeaveGame}
        >
          <Ionicons name="exit-outline" size={20} color="#FFF" />
          <Text style={styles.actionButtonText}>Leave</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            isReady ? styles.unreadyButton : styles.readyButton,
          ]}
          onPress={onReady}
        >
          <Ionicons
            name={isReady ? "close-circle-outline" : "checkmark-circle-outline"}
            size={20}
            color="#FFF"
          />
          <Text style={styles.actionButtonText}>
            {isReady ? "Not Ready" : "Ready"}
          </Text>
        </TouchableOpacity>

        {isHost && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.startButton,
              !allPlayersReady && styles.disabledButton,
            ]}
            onPress={onStartGame}
            disabled={!allPlayersReady}
          >
            <Ionicons name="play" size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Start</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#222",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F2FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  shareText: {
    color: "#007AFF",
    marginLeft: 4,
    fontWeight: "600",
  },
  gameInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  gameIdLabel: {
    fontSize: 16,
    color: "#666",
  },
  gameId: {
    fontWeight: "600",
    color: "#333",
  },
  playersCount: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  playersList: {
    maxHeight: 250,
    marginBottom: 16,
  },
  playersListHeader: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  playerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  playerScore: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  readyStatus: {
    backgroundColor: "#E3FCEF",
  },
  notReadyStatus: {
    backgroundColor: "#FFEEEE",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  optionsToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    marginBottom: 16,
  },
  optionsToggleText: {
    color: "#007AFF",
    fontWeight: "600",
    marginRight: 4,
  },
  optionsContainer: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#333",
    textAlign: "center",
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  optionLabel: {
    fontSize: 16,
    color: "#444",
    fontWeight: "500",
  },
  optionControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionButton: {
    width: 40,
    height: 40,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  optionButtonText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#007AFF",
  },
  optionValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    width: 60,
    textAlign: "center",
  },
  languageContainer: {
    flexDirection: "row",
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F0F0F0",
    marginLeft: 8,
  },
  selectedLanguage: {
    backgroundColor: "#007AFF",
  },
  languageText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  hostOnlyMessage: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 12,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 6,
  },
  leaveButton: {
    backgroundColor: "#FF3B30",
  },
  readyButton: {
    backgroundColor: "#34C759",
  },
  unreadyButton: {
    backgroundColor: "#FF9500",
  },
  startButton: {
    backgroundColor: "#007AFF",
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default GameLobby;
