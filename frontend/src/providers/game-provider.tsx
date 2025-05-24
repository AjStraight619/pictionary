import {
  ChatMessage,
  Cursor,
  GameState,
  GameStatus,
  Player,
  Turn,
  TurnPhase,
  Word,
} from "@/types/game";
import { ToastEvent } from "@/types/messages";
import React, { createContext, useContext, useReducer } from "react";

type Action =
  | { type: "GAME_STATE_UPDATE"; payload: GameState }
  | { type: "PLAYER_GUESS"; payload: ChatMessage }
  | { type: "PLAYER_JOINED"; payload: Player }
  | { type: "PLAYER_LEFT"; payload: string }
  | {
      type: "ADD_REVEALED_LETTER";
      payload: { letters: Array<string | number> };
    }
  | { type: "DRAWING_PLAYER_CHANGED"; payload: Player }
  | { type: "SELECTED_WORD"; payload: { word: Word; isSelectingWord: boolean } }
  | {
      type: "SELECT_WORD_MODAL";
      payload: { isSelectingWord: boolean; selectableWords: Word[] };
    }
  | { type: "CLOSE_SELECT_WORD_MODAL" }
  | { type: "SCORE_UPDATED"; payload: { playerID: string; score: number } }
  | { type: "PLAYER_READY"; payload: { playerID: string } }
  | {
      type: "CURSOR_UPDATE";
      payload: { playerID: string; cursor: Cursor | null };
    }
  | { type: "TOAST"; payload: ToastEvent }
  | { type: "LETTER_REVEALED"; payload: { position: number; letter: string } }
  | { type: "RESET_POINTS_CHANGE"; payload: { playerID: string } };

function setSelectedWord(turn: Turn, word: Word): Turn {
  return {
    ...turn,
    wordToGuess: word,
    revealedLetters: [],
    phase: TurnPhase.PhaseDrawing,
  };
}

const gameReducer = (state: GameState, action: Action): GameState => {
  switch (action.type) {
    case "GAME_STATE_UPDATE":
      return { ...state, ...action.payload };
    case "PLAYER_JOINED":
      return { ...state, players: [...state.players, action.payload] };
    case "PLAYER_LEFT":
      return {
        ...state,
        players: state.players.filter((p) => p.ID !== action.payload),
      };
    case "PLAYER_GUESS":
      return {
        ...state,
        chatMessages: [...state.chatMessages, action.payload],
      };
    case "ADD_REVEALED_LETTER":
      if (!state.turn) return state;
      return {
        ...state,
        turn: {
          ...state.turn,
          revealedLetters: action.payload.letters,
        },
      };

    case "LETTER_REVEALED":
      if (!state.turn) return state;
      return {
        ...state,
        turn: {
          ...state.turn,
          revealedLetters: [
            ...state.turn.revealedLetters,
            action.payload.letter,
          ],
        },
      };

    case "DRAWING_PLAYER_CHANGED":
      return {
        ...state,
        players: state.players.map((p) => ({
          ...p,
          isDrawing: p.ID === action.payload.ID,
        })),
      };

    case "SELECTED_WORD":
      // TODO: make this cleaner
      return {
        ...state,
        turn: state.turn
          ? setSelectedWord(state.turn, action.payload.word)
          : {
              wordToGuess: { word: "", category: "", id: "" },
              revealedLetters: [],
              phase: TurnPhase.PhaseWordSelection,
            },
        isSelectingWord: false,
      };
    case "SELECT_WORD_MODAL":
      return {
        ...state,
        isSelectingWord: true,
        selectableWords: action.payload.selectableWords,
      };

    case "CLOSE_SELECT_WORD_MODAL":
      return {
        ...state,
        isSelectingWord: false,
      };

    case "SCORE_UPDATED":
      return {
        ...state,
        players: state.players.map((p) =>
          p.ID === action.payload.playerID
            ? { ...p, score: action.payload.score }
            : p
        ),
      };

    case "RESET_POINTS_CHANGE":
      return {
        ...state,
        players: state.players.map((p) =>
          p.ID === action.payload.playerID ? { ...p, pointsChange: 0 } : p
        ),
      };

    case "PLAYER_READY":
      return {
        ...state,
        players: state.players.map((p) =>
          p.ID === action.payload.playerID ? { ...p, isReady: true } : p
        ),
      };

    case "CURSOR_UPDATE":
      return { ...state, activeCursor: action.payload.cursor };
    default:
      return state;
  }
};

const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(gameReducer, {
    id: "",
    players: [],
    status: GameStatus.InProgress,
    activeCursor: null,
    playerOrder: [],
    options: { roundLimit: 8, turnTimeLimit: 60, selectWordTimeLimit: 30 },
    round: null,
    turn: null,
    selectableWords: [],
    isSelectingWord: false,
    chatMessages: [],
  });

  return (
    <GameContext.Provider
      value={{
        state,
        dispatch,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error("useGame must be used within GameProvider");
  }

  return context;
};
