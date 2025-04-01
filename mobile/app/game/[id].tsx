import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { GameWebSocket } from "../../utils/websocket";
import { getPlayerInfo } from "../../utils/storage";
import { GameState, GameStatus, TurnPhase, Word } from "../../types/game";
import SkiaCanvas from "../../components/SkiaCanvas";
import GameChat from "../../components/GameChat";
import { Ionicons } from "@expo/vector-icons";

export default function GameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [playerInfo, setPlayerInfo] = useState<{
    playerID: string;
    username: string;
  } | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectableWords, setSelectableWords] = useState<Word[]>([]);
  const [isSelectingWord, setIsSelectingWord] = useState(false);
  const [activeTab, setActiveTab] = useState<"canvas" | "chat">("canvas");
  const [countdownTimer, setCountdownTimer] = useState<number | null>(null);

  const wsRef = useRef<GameWebSocket | null>(null);

  useEffect(() => {
    const initializeGame = async () => {
      try {
        const player = await getPlayerInfo();
        if (!player || !player.playerID) {
          setError(
            "Player information not found. Please return to the home screen."
          );
          return;
        }

        setPlayerInfo(player);

        // Initialize WebSocket connection
        const ws = new GameWebSocket(id as string, player.playerID);
        wsRef.current = ws;

        // Set up event handlers
        ws.on("gameState", (state) => {
          setGameState(state);
          setIsConnecting(false);
        });

        ws.on("openSelectWordModal", ({ isSelectingWord, selectableWords }) => {
          setIsSelectingWord(isSelectingWord);
          setSelectableWords(selectableWords);
        });

        // Add handler for timer events
        ws.on("startTimer", (data) => {
          if (data.timerType === "gameStartTimer") {
            setCountdownTimer(data.duration);
          }
        });

        // Add handler for timer stop events
        ws.on("stopTimer", (data) => {
          if (data.timerType === "gameStartTimer") {
            setCountdownTimer(null);
          }
        });

        // Connect to the game - updated to handle async
        ws.connect().catch((err) => {
          console.error("Error connecting to WebSocket:", err);
          setError("Failed to connect to the game server.");
          setIsConnecting(false);
        });

        return () => {
          // Clean up on unmount
          if (wsRef.current) {
            wsRef.current.disconnect();
          }
        };
      } catch (error) {
        console.error("Error initializing game:", error);
        setError("Failed to connect to the game.");
        setIsConnecting(false);
      }
    };

    initializeGame();
  }, [id]);

  const isDrawing =
    gameState?.round?.currentDrawerID === playerInfo?.playerID &&
    gameState?.turn?.phase === TurnPhase.PhaseDrawing;

  // Debugging logs
  console.log("Current player ID:", playerInfo?.playerID);
  console.log("Current drawer ID:", gameState?.round?.currentDrawerID);
  console.log("Turn phase:", gameState?.turn?.phase);
  console.log("Is Drawing calculated:", isDrawing);

  // Force drawing for testing purposes
  const forceDrawing = true;

  const sendDrawingData = useCallback(
    (path: string, color: string, strokeWidth: number) => {
      console.log("Sending drawing data:", { path, color, strokeWidth });
      if ((isDrawing || forceDrawing) && wsRef.current && gameState) {
        wsRef.current.send("drawingData", {
          type: "pencil",
          path,
          color,
          strokeWidth,
        });
      }
    },
    [isDrawing, forceDrawing, wsRef, gameState]
  );

  const selectWord = (word: Word) => {
    if (wsRef.current) {
      wsRef.current.send("selectedWord", {
        word,
        isSelectingWord: false,
      });
    }
  };

  const renderWordSelection = () => {
    if (!isSelectingWord || selectableWords.length === 0) return null;

    return (
      <View style={styles.wordSelectionContainer}>
        <Text style={styles.wordSelectionTitle}>Choose a word to draw:</Text>
        <View style={styles.wordButtons}>
          {selectableWords.map((word) => (
            <TouchableOpacity
              key={word.id}
              style={styles.wordButton}
              onPress={() => selectWord(word)}
            >
              <Text style={styles.wordButtonText}>{word.word}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderTabs = () => {
    return (
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "canvas" && styles.activeTab]}
          onPress={() => setActiveTab("canvas")}
        >
          <Ionicons
            name="brush"
            size={24}
            color={activeTab === "canvas" ? "#2563EB" : "#6B7280"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "canvas" && styles.activeTabText,
            ]}
          >
            Canvas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "chat" && styles.activeTab]}
          onPress={() => setActiveTab("chat")}
        >
          <Ionicons
            name="chatbubble"
            size={24}
            color={activeTab === "chat" ? "#2563EB" : "#6B7280"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "chat" && styles.activeTabText,
            ]}
          >
            Chat
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderMainContent = () => {
    if (activeTab === "canvas") {
      return (
        <View style={styles.canvasContainer}>
          <SkiaCanvas
            isDrawing={isDrawing || forceDrawing}
            onDrawingData={sendDrawingData}
          />
        </View>
      );
    } else {
      return (
        <View style={styles.chatContainer}>
          {playerInfo && wsRef.current && (
            <GameChat
              username={playerInfo.username}
              websocket={wsRef.current}
              playerID={playerInfo.playerID}
            />
          )}
        </View>
      );
    }
  };

  const renderGameContent = () => {
    if (isConnecting) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Connecting to game...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    if (!gameState) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Failed to load game state.</Text>
        </View>
      );
    }

    // Render pregame lobby if game not started
    if (gameState.status === GameStatus.NotStarted) {
      return renderPreGameLobby();
    }

    // Render main game UI if game is in progress
    return (
      <View style={styles.gameContent}>
        {/* Game info */}
        <View style={styles.gameInfoContainer}>
          <View style={styles.roundInfo}>
            <Text style={styles.infoText}>
              Round: {gameState.round?.count || 0}/
              {gameState.options.roundLimit}
            </Text>
          </View>

          {gameState.turn?.wordToGuess && isDrawing ? (
            <View style={styles.wordToDrawContainer}>
              <Text style={styles.wordToDraw}>
                Draw: {gameState.turn.wordToGuess.word}
              </Text>
            </View>
          ) : gameState.turn?.wordToGuess && !isDrawing ? (
            <View style={styles.wordToGuessContainer}>
              <Text style={styles.wordToGuess}>
                Word: {gameState.turn.revealedLetters.join(" ")}
              </Text>
            </View>
          ) : null}

          {gameState.round?.currentDrawerID && (
            <View style={styles.drawerInfo}>
              <Text style={styles.infoText}>
                {
                  gameState.players.find(
                    (p) => p.ID === gameState.round?.currentDrawerID
                  )?.username
                }{" "}
                is drawing
              </Text>
            </View>
          )}
        </View>

        {renderWordSelection()}

        {/* Tabs for Canvas/Chat */}
        {renderTabs()}

        {/* Main content area - Both Canvas and Chat are kept mounted */}
        <View style={styles.mainContentContainer}>
          <View
            style={[
              styles.canvasContainer,
              { display: activeTab === "canvas" ? "flex" : "none" },
            ]}
          >
            <SkiaCanvas
              isDrawing={isDrawing || forceDrawing}
              onDrawingData={sendDrawingData}
            />
          </View>

          <View
            style={[
              styles.chatContainer,
              { display: activeTab === "chat" ? "flex" : "none" },
            ]}
          >
            {playerInfo && wsRef.current && (
              <GameChat
                username={playerInfo.username}
                websocket={wsRef.current}
                playerID={playerInfo.playerID}
              />
            )}
          </View>
        </View>

        {/* Players list */}
        <View style={styles.playersContainer}>
          <Text style={styles.sectionTitle}>Players</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {gameState.players.map((player) => (
              <View
                key={player.ID}
                style={[
                  styles.playerItem,
                  player.isDrawing && styles.activePlayer,
                ]}
              >
                <Text style={styles.playerName}>
                  {player.username} {player.isHost ? "(Host)" : ""}
                </Text>
                <Text style={styles.playerScore}>{player.score}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  // New function to render the pregame lobby
  const renderPreGameLobby = () => {
    const isPlayerReady = playerInfo
      ? gameState?.players.find((p) => p.ID === playerInfo.playerID)?.ready ??
        false
      : false;

    return (
      <View style={styles.lobbyContainer}>
        <Text style={styles.lobbyTitle}>Game Lobby</Text>

        {countdownTimer !== null && (
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownText}>
              Game starting in {countdownTimer} seconds
            </Text>
          </View>
        )}

        <View style={styles.playersSection}>
          <Text style={styles.sectionTitle}>Players</Text>
          <View style={styles.playersList}>
            {gameState?.players.map((player) => (
              <View
                key={player.ID}
                style={[
                  styles.lobbyPlayerItem,
                  player.ready && styles.lobbyPlayerItemReady,
                ]}
              >
                <Text style={styles.lobbyPlayerName}>
                  {player.username} {player.isHost ? "(Host)" : ""}
                </Text>
                <View
                  style={[
                    styles.readyStatusIndicator,
                    player.ready
                      ? styles.readyStatusIndicatorReady
                      : styles.readyStatusIndicatorNotReady,
                  ]}
                >
                  <Text style={styles.readyStatusText}>
                    {player.ready ? "Ready" : "Not Ready"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {playerInfo &&
          gameState?.players.find((p) => p.ID === playerInfo.playerID)
            ?.isHost && (
            <>
              <TouchableOpacity
                style={[
                  styles.startGameButton,
                  !gameState.players.every((p) => p.ready) &&
                    styles.startGameButtonDisabled,
                ]}
                disabled={!gameState.players.every((p) => p.ready)}
                onPress={() => {
                  if (
                    wsRef.current &&
                    gameState.players.every((p) => p.ready)
                  ) {
                    wsRef.current.send("startTimer", {
                      timerType: "startGameCountdown",
                      duration: 5,
                    });
                  }
                }}
              >
                <Text style={styles.startGameButtonText}>
                  {gameState.players.every((p) => p.ready)
                    ? "Start Game"
                    : "Waiting for all players to be ready"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.forceStartButton]}
                onPress={() => {
                  if (wsRef.current) {
                    wsRef.current.send("startGame", {
                      force: true,
                    });
                  }
                }}
              >
                <Text style={styles.forceStartButtonText}>Force Start</Text>
              </TouchableOpacity>
            </>
          )}

        {playerInfo && !isPlayerReady && (
          <TouchableOpacity
            style={styles.readyButton}
            onPress={() => {
              if (wsRef.current) {
                wsRef.current.send("playerReady", {
                  playerID: playerInfo.playerID,
                });
              }
            }}
          >
            <Text style={styles.readyButtonText}>Ready</Text>
          </TouchableOpacity>
        )}

        {playerInfo && isPlayerReady && (
          <View style={styles.alreadyReadyContainer}>
            <Text style={styles.alreadyReadyText}>
              You are ready! Waiting for other players...
            </Text>
          </View>
        )}
      </View>
    );
  };

  return <View style={styles.container}>{renderGameContent()}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 16,
    textAlign: "center",
  },
  gameContent: {
    flex: 1,
  },
  gameInfoContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  roundInfo: {
    marginBottom: 8,
  },
  drawerInfo: {
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#4B5563",
  },
  wordToDrawContainer: {
    backgroundColor: "#EFF6FF",
    padding: 8,
    borderRadius: 6,
    marginVertical: 8,
  },
  wordToDraw: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2563EB",
    textAlign: "center",
  },
  wordToGuessContainer: {
    backgroundColor: "#F5F3FF",
    padding: 8,
    borderRadius: 6,
    marginVertical: 8,
  },
  wordToGuess: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#7C3AED",
    textAlign: "center",
  },
  canvasContainer: {
    flex: 1,
    marginBottom: 16,
  },
  chatContainer: {
    flex: 1,
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 12,
    backgroundColor: "#FFF",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#EFF6FF",
  },
  tabText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
  },
  activeTabText: {
    color: "#2563EB",
  },
  playersContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  playerItem: {
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
    padding: 8,
    marginRight: 8,
    minWidth: 80,
    alignItems: "center",
  },
  activePlayer: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    borderWidth: 1,
  },
  playerName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  playerScore: {
    fontSize: 12,
    color: "#6B7280",
  },
  wordSelectionContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  wordSelectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
    textAlign: "center",
  },
  wordButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  wordButton: {
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    padding: 12,
    margin: 4,
    minWidth: 100,
    alignItems: "center",
  },
  wordButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2563EB",
  },
  mainContentContainer: {
    flex: 1,
    marginBottom: 16,
  },
  lobbyContainer: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  lobbyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 24,
    textAlign: "center",
  },
  countdownContainer: {
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  countdownText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2563EB",
  },
  playersSection: {
    marginBottom: 24,
  },
  playersList: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 12,
  },
  lobbyPlayerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  lobbyPlayerItemReady: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  lobbyPlayerName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
  },
  readyStatusIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  readyStatusIndicatorReady: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
  },
  readyStatusIndicatorNotReady: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
  },
  readyStatusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  startGameButton: {
    backgroundColor: "#2563EB",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  startGameButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  readyButton: {
    backgroundColor: "#10B981",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  readyButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  startGameButtonDisabled: {
    backgroundColor: "#93C5FD",
    opacity: 0.7,
  },
  alreadyReadyContainer: {
    padding: 16,
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: 8,
  },
  alreadyReadyText: {
    fontSize: 16,
    color: "#10B981",
    fontWeight: "500",
  },
  forceStartButton: {
    backgroundColor: "#EF4444",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
    marginTop: 8,
  },
  forceStartButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  forceStartDescription: {
    color: "#FFF",
    fontSize: 12,
    marginTop: 4,
  },
});
