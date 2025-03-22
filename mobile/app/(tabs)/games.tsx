import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getPlayerInfo } from "../../utils/storage";

type GameItem = {
  id: string;
  hostName: string;
  players: number;
  maxPlayers: number;
  status: "waiting" | "in-progress" | "finished";
  created: string;
};

export default function GamesScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeGames, setActiveGames] = useState<GameItem[]>([]);
  const [recentGames, setRecentGames] = useState<GameItem[]>([]);

  useEffect(() => {
    // In a real app, you would fetch active games from your API
    const loadGames = async () => {
      setIsLoading(true);
      try {
        // Simulating API call with sample data
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // These would come from your API in a real app
        setActiveGames([
          {
            id: "game-123",
            hostName: "Sarah",
            players: 3,
            maxPlayers: 6,
            status: "waiting",
            created: "5 mins ago",
          },
          {
            id: "game-456",
            hostName: "Mike",
            players: 4,
            maxPlayers: 6,
            status: "in-progress",
            created: "10 mins ago",
          },
        ]);

        setRecentGames([
          {
            id: "game-789",
            hostName: "John",
            players: 5,
            maxPlayers: 6,
            status: "finished",
            created: "Yesterday",
          },
        ]);
      } catch (error) {
        console.error("Error loading games:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGames();
  }, []);

  const renderGameItem = ({ item }: { item: GameItem }) => (
    <TouchableOpacity
      style={styles.gameCard}
      onPress={() => router.push(`/game/${item.id}`)}
    >
      <View style={styles.gameCardHeader}>
        <Text style={styles.hostName}>{item.hostName}'s Game</Text>
        <View
          style={[
            styles.statusBadge,
            item.status === "waiting"
              ? styles.waitingBadge
              : item.status === "in-progress"
              ? styles.inProgressBadge
              : styles.finishedBadge,
          ]}
        >
          <Text style={styles.statusText}>
            {item.status === "waiting"
              ? "Waiting"
              : item.status === "in-progress"
              ? "In Progress"
              : "Finished"}
          </Text>
        </View>
      </View>

      <View style={styles.gameCardContent}>
        <View style={styles.gameCardContentRow}>
          <Ionicons name="people" size={16} color="#6B7280" />
          <Text style={styles.infoText}>
            {item.players}/{item.maxPlayers} players
          </Text>
        </View>
        <View style={styles.gameCardContentRow}>
          <Ionicons name="time" size={16} color="#6B7280" />
          <Text style={styles.infoText}>{item.created}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading games...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Games</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push("/")}
        >
          <Text style={styles.createButtonText}>New Game</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Active Games</Text>
      {activeGames.length > 0 ? (
        <FlatList
          data={activeGames}
          renderItem={renderGameItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="game-controller" size={48} color="#D1D5DB" />
          <Text style={styles.emptyStateText}>No active games</Text>
          <Text style={styles.emptyStateSubtext}>
            Create a new game to get started
          </Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Recent Games</Text>
      {recentGames.length > 0 ? (
        <FlatList
          data={recentGames}
          renderItem={renderGameItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No recent games</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  createButton: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  createButtonText: {
    color: "white",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  list: {
    flex: 1,
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 8,
  },
  gameCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  gameCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  hostName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  waitingBadge: {
    backgroundColor: "#FEFCE8",
  },
  inProgressBadge: {
    backgroundColor: "#EFF6FF",
  },
  finishedBadge: {
    backgroundColor: "#F3F4F6",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  gameCardContent: {
    gap: 8,
  },
  gameCardContentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#6B7280",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 24,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 4,
  },
});
