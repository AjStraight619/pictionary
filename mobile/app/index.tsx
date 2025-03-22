import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Text, View } from "react-native";
import { createGame, joinGame } from "../utils/api";
import { getPlayerInfo, setPlayerInfo } from "../utils/storage";
import { GameOptions } from "../types/game";
import { PlayerInfo } from "../types/lobby";
import { router } from "expo-router";

export default function HomeScreen() {
  const [username, setUsername] = useState<string>("");
  const [gameCode, setGameCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [gameOptions, setGameOptions] = useState<GameOptions>({
    roundLimit: 6,
    turnTimeLimit: 60,
    selectWordTimeLimit: 20,
    maxPlayers: 6,
  });

  useEffect(() => {
    // Load stored player info
    const loadPlayerInfo = async () => {
      const info = await getPlayerInfo();
      if (info?.username) {
        setUsername(info.username);
      }
    };

    loadPlayerInfo();
  }, []);

  const handleQuickPlay = async () => {
    if (username.length < 3 || username.length > 12) {
      setError("Player name must be between 3 and 12 characters.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await createGame(username, {
        roundLimit: 6,
        turnTimeLimit: 60,
        selectWordTimeLimit: 20,
        maxPlayers: 6,
      });

      await setPlayerInfo({
        playerID: result.playerID,
        username,
      });

      // Navigate to the game screen
      router.push(`/game/${result.gameID}`);
    } catch (error) {
      console.error("Error creating game:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGame = async () => {
    if (username.length < 3 || username.length > 12) {
      setError("Player name must be between 3 and 12 characters.");
      return;
    }

    const { roundLimit, turnTimeLimit, selectWordTimeLimit, maxPlayers } =
      gameOptions;

    if (roundLimit < 3 || roundLimit > 10) {
      setError("Max Rounds must be between 3 and 10.");
      return;
    }

    if (turnTimeLimit < 40 || turnTimeLimit > 80) {
      setError("Round Timer must be between 40 and 80 seconds.");
      return;
    }

    if (selectWordTimeLimit < 10 || selectWordTimeLimit > 30) {
      setError("Word Select Timer must be between 10 and 30 seconds.");
      return;
    }

    if (maxPlayers < 2 || maxPlayers > 8) {
      setError("Max Players must be between 2 and 8.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await createGame(username, gameOptions);

      await setPlayerInfo({
        playerID: result.playerID,
        username,
      });

      // Navigate to the game screen
      router.push(`/game/${result.gameID}`);
    } catch (error) {
      console.error("Error creating game:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGame = async () => {
    if (username.length < 3 || username.length > 12) {
      setError("Player name must be between 3 and 12 characters.");
      return;
    }

    if (!gameCode.trim()) {
      setError("Please enter a game code.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await joinGame(username, gameCode);

      await setPlayerInfo({
        playerID: result.playerID,
        username,
      });

      // Navigate to the game screen
      router.push(`/game/${result.gameID}`);
    } catch (error) {
      console.error("Error joining game:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Pictionary Pals</Text>
        <Text style={styles.subtitle}>Draw, Guess, Laugh!</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Player Name</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter your name"
            maxLength={12}
            autoCorrect={false}
          />
        </View>

        <View style={styles.quickPlayContainer}>
          <Text style={styles.sectionTitle}>Quick Play</Text>
          <Text style={styles.description}>
            Start a new game with default settings
          </Text>
          <View style={styles.buttonContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#6366F1" />
            ) : (
              <TouchableOpacity style={styles.button} onPress={handleQuickPlay}>
                <Text style={styles.buttonText}>Start Game</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "create" && styles.activeTab]}
            onPress={() => setActiveTab("create")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "create" && styles.activeTabText,
              ]}
            >
              Create
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "join" && styles.activeTab]}
            onPress={() => setActiveTab("join")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "join" && styles.activeTabText,
              ]}
            >
              Join
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "create" ? (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Create Game</Text>

            <View style={styles.inputRow}>
              <Text style={styles.label}>Rounds</Text>
              <TextInput
                style={styles.numberInput}
                keyboardType="number-pad"
                value={gameOptions.roundLimit.toString()}
                onChangeText={(value) =>
                  setGameOptions({
                    ...gameOptions,
                    roundLimit: parseInt(value) || 0,
                  })
                }
                maxLength={2}
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.label}>Turn Time (sec)</Text>
              <TextInput
                style={styles.numberInput}
                keyboardType="number-pad"
                value={gameOptions.turnTimeLimit.toString()}
                onChangeText={(value) =>
                  setGameOptions({
                    ...gameOptions,
                    turnTimeLimit: parseInt(value) || 0,
                  })
                }
                maxLength={2}
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.label}>Word Select Time (sec)</Text>
              <TextInput
                style={styles.numberInput}
                keyboardType="number-pad"
                value={gameOptions.selectWordTimeLimit.toString()}
                onChangeText={(value) =>
                  setGameOptions({
                    ...gameOptions,
                    selectWordTimeLimit: parseInt(value) || 0,
                  })
                }
                maxLength={2}
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.label}>Max Players</Text>
              <TextInput
                style={styles.numberInput}
                keyboardType="number-pad"
                value={gameOptions.maxPlayers.toString()}
                onChangeText={(value) =>
                  setGameOptions({
                    ...gameOptions,
                    maxPlayers: parseInt(value) || 0,
                  })
                }
                maxLength={1}
              />
            </View>

            <View style={styles.buttonContainer}>
              {isLoading ? (
                <ActivityIndicator size="large" color="#6366F1" />
              ) : (
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleCreateGame}
                >
                  <Text style={styles.buttonText}>Create Game</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Join Game</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Game Code</Text>
              <TextInput
                style={styles.input}
                value={gameCode}
                onChangeText={setGameCode}
                placeholder="Enter game code"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={styles.buttonContainer}>
              {isLoading ? (
                <ActivityIndicator size="large" color="#6366F1" />
              ) : (
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleJoinGame}
                >
                  <Text style={styles.buttonText}>Join Game</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  contentContainer: {
    padding: 16,
  },
  titleContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#111827",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 4,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
    color: "#374151",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  quickPlayContainer: {
    marginVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
  buttonContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  button: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  tabs: {
    flexDirection: "row",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#6366F1",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
  },
  activeTabText: {
    color: "#6366F1",
  },
  tabContent: {
    marginTop: 8,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    width: 70,
    textAlign: "center",
  },
  errorText: {
    color: "#EF4444",
    marginTop: 8,
    fontSize: 14,
  },
});
