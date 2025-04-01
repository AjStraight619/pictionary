import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GameWebSocket } from "../utils/websocket";

type ChatMessage = {
  username: string;
  guess: string;
  id?: string; // Optional ID for deduplication
};

type GameChatProps = {
  username: string;
  websocket: GameWebSocket;
  playerID: string;
};

const GameChat: React.FC<GameChatProps> = ({
  username,
  websocket,
  playerID,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingMessages, setPendingMessages] = useState<
    Record<string, boolean>
  >({});
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Listen for chat messages from the websocket
  useEffect(() => {
    if (!websocket) return;

    // Add listener for player guesses
    websocket.on("playerGuess", (data) => {
      if (data && data.username && data.guess) {
        // Check if this is our own message that we already added locally
        const messageKey = `${data.username}:${data.guess}`;
        if (pendingMessages[messageKey]) {
          // This is our own message that we already displayed, so remove it from pending
          setPendingMessages((prev) => {
            const newPending = { ...prev };
            delete newPending[messageKey];
            return newPending;
          });
          return;
        }

        // Not a duplicate, add it to messages
        setMessages((prev) => [...prev, data]);
      }
    });
  }, [websocket, pendingMessages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Add keyboard listeners
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  // Send a guess message
  const handleSendMessage = () => {
    if (inputText.trim() === "" || !websocket) return;

    const guess = inputText.trim();
    const messageKey = `${username}:${guess}`;

    // Send the guess using the existing websocket
    websocket.send("playerGuess", {
      playerID,
      username,
      guess: guess,
    });

    // Track this message as pending to avoid duplicates
    setPendingMessages((prev) => ({
      ...prev,
      [messageKey]: true,
    }));

    // Add the message to local state immediately for faster UI feedback
    setMessages((prev) => [
      ...prev,
      {
        username,
        guess: guess,
      },
    ]);
    setInputText("");
  };

  // Dismiss keyboard when tapping outside the input
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Render individual message
  const renderMessage = ({
    item,
    index,
  }: {
    item: ChatMessage;
    index: number;
  }) => (
    <View style={styles.messageContainer} key={index}>
      <Text style={styles.username}>{item.username}</Text>
      <Text style={styles.messageText}>: {item.guess}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 85 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Game Chat</Text>
        </View>

        {/* Messages List */}
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View style={styles.messageListContainer}>
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(_, index) => index.toString()}
              contentContainerStyle={styles.messagesContent}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    No messages yet. Start guessing!
                  </Text>
                </View>
              )}
            />
          </View>
        </TouchableWithoutFeedback>

        {/* Input area - improved for keyboard visibility */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your guess..."
              returnKeyType="send"
              onSubmitEditing={handleSendMessage}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                inputText.trim() === "" ? styles.disabledButton : null,
              ]}
              onPress={handleSendMessage}
              disabled={inputText.trim() === ""}
            >
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
  },
  header: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    textAlign: "center",
  },
  messageListContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 10,
    paddingBottom: Platform.OS === "ios" ? 100 : 80, // Extra padding for iOS
  },
  messageContainer: {
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  username: {
    fontWeight: "bold",
    color: "#9333EA", // Purple color like the web version
  },
  messageText: {
    color: "#666666",
  },
  inputWrapper: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    backgroundColor: "#FFFFFF",
    // Removed position absolute to work better with KeyboardAvoidingView
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    paddingBottom: Platform.OS === "ios" ? 30 : 10, // Extra padding on iOS
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: "#F0F0F0",
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#B0B0B0",
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#999999",
    fontSize: 14,
    textAlign: "center",
  },
});

export default GameChat;
