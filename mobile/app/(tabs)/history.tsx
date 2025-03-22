import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getPlayerInfo } from "../../utils/storage";

type GameHistoryItem = {
  id: string;
  date: string;
  players: string[];
  winner: string;
  score: number;
  position: number;
  word?: string;
};

export default function HistoryScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<GameHistoryItem[]>([]);
  const [stats, setStats] = useState({
    totalGames: 0,
    wins: 0,
    bestScore: 0,
    wordsGuessed: 0,
    wordsDrawn: 0,
  });

  useEffect(() => {
    // In a real app, you would fetch game history from your API
    const loadHistory = async () => {
      setIsLoading(true);
      try {
        // Get player info to know who the current user is
        const playerInfo = await getPlayerInfo();

        // Simulating API call with sample data
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // This would come from your API in a real app
        const historyData: GameHistoryItem[] = [
          {
            id: "game-123",
            date: "2 hours ago",
            players: ["Sarah", "John", "Mike", "Alex"],
            winner: "Sarah",
            score: 350,
            position: 2,
            word: "elephant",
          },
          {
            id: "game-456",
            date: "Yesterday",
            players: ["Mike", "Alex", "Lisa", "Sarah"],
            winner: "Mike",
            score: 420,
            position: 1,
          },
          {
            id: "game-789",
            date: "2 days ago",
            players: ["John", "Lisa", "Sarah", "Alex", "Mike"],
            winner: "Alex",
            score: 280,
            position: 3,
            word: "airplane",
          },
        ];

        setHistory(historyData);

        // Calculate statistics
        const totalGames = historyData.length;
        const wins = historyData.filter(
          (game) => game.winner === playerInfo?.username
        ).length;
        const bestScore = Math.max(...historyData.map((game) => game.score));
        const wordsGuessed = historyData.length * 3; // Assuming ~3 words guessed per game
        const wordsDrawn = historyData.filter((game) => game.word).length;

        setStats({
          totalGames,
          wins,
          bestScore,
          wordsGuessed,
          wordsDrawn,
        });
      } catch (error) {
        console.error("Error loading game history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, []);

  const renderHistoryItem = ({ item }: { item: GameHistoryItem }) => (
    <View style={styles.historyCard}>
      <View style={styles.historyCardHeader}>
        <Text style={styles.dateText}>{item.date}</Text>
        <View
          style={[
            styles.positionBadge,
            item.position === 1
              ? styles.firstPlaceBadge
              : item.position === 2
              ? styles.secondPlaceBadge
              : item.position === 3
              ? styles.thirdPlaceBadge
              : styles.otherPlaceBadge,
          ]}
        >
          <Text style={styles.positionText}>#{item.position}</Text>
        </View>
      </View>

      <View style={styles.gameDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="trophy" size={16} color="#F59E0B" />
          <Text style={styles.detailText}>
            Winner: <Text style={styles.highlightText}>{item.winner}</Text>
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="stats-chart" size={16} color="#6366F1" />
          <Text style={styles.detailText}>
            Your score: <Text style={styles.highlightText}>{item.score}</Text>
          </Text>
        </View>

        {item.word && (
          <View style={styles.detailRow}>
            <Ionicons name="pencil" size={16} color="#10B981" />
            <Text style={styles.detailText}>
              You drew: <Text style={styles.highlightText}>{item.word}</Text>
            </Text>
          </View>
        )}

        <View style={styles.playersContainer}>
          <Text style={styles.playersLabel}>Players:</Text>
          <View style={styles.playersList}>
            {item.players.map((player, index) => (
              <Text key={index} style={styles.playerName}>
                {player}
                {index < item.players.length - 1 ? ", " : ""}
              </Text>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Game History</Text>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalGames}</Text>
          <Text style={styles.statLabel}>Games</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.wins}</Text>
          <Text style={styles.statLabel}>Wins</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.bestScore}</Text>
          <Text style={styles.statLabel}>Best Score</Text>
        </View>
      </View>

      <View style={styles.statsRowContainer}>
        <View style={styles.statRow}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.statRowText}>
            {stats.wordsGuessed} words guessed
          </Text>
        </View>

        <View style={styles.statRow}>
          <Ionicons name="pencil" size={20} color="#6366F1" />
          <Text style={styles.statRowText}>{stats.wordsDrawn} words drawn</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Games</Text>
      {history.length > 0 ? (
        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="time" size={48} color="#D1D5DB" />
          <Text style={styles.emptyStateText}>No game history yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Play some games to see your history
          </Text>
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6366F1",
  },
  statLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  statsRowContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statRowText: {
    fontSize: 14,
    color: "#4B5563",
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 16,
  },
  historyCard: {
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
  historyCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dateText: {
    fontSize: 14,
    color: "#6B7280",
  },
  positionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  firstPlaceBadge: {
    backgroundColor: "#FEF3C7",
  },
  secondPlaceBadge: {
    backgroundColor: "#F3F4F6",
  },
  thirdPlaceBadge: {
    backgroundColor: "#FEF2F2",
  },
  otherPlaceBadge: {
    backgroundColor: "#F3F4F6",
  },
  positionText: {
    fontSize: 12,
    fontWeight: "600",
  },
  gameDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: "#4B5563",
    marginLeft: 8,
  },
  highlightText: {
    fontWeight: "500",
    color: "#111827",
  },
  playersContainer: {
    marginTop: 8,
    flexDirection: "row",
  },
  playersLabel: {
    fontSize: 14,
    color: "#4B5563",
    marginRight: 4,
  },
  playersList: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  playerName: {
    fontSize: 14,
    color: "#111827",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "white",
    borderRadius: 12,
    marginTop: 8,
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
