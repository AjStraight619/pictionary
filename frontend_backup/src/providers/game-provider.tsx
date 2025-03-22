import { GameState, GameStatus, Turn, TurnPhase, Word } from "@/types/game";
import { Player } from "@/types/lobby";
import React, { createContext, useContext, useReducer, useState } from "react";

type Action =
  | { type: "GAME_STATE_UPDATE"; payload: GameState }
  | { type: "PLAYER_JOINED"; payload: Player }
  | { type: "PLAYER_LEFT"; payload: string }
  | { type: "ADD_REVEALED_LETTER"; payload: string }
  | { type: "DRAWING_PLAYER_CHANGED"; payload: Player }
  | { type: "SELECTED_WORD"; payload: { word: Word; isSelectingWord: boolean } }
  | {
      type: "SELECT_WORD_MODAL";
      payload: { isSelectingWord: boolean; selectableWords: Word[] };
    }
  | { type: "SCORE_UPDATED"; payload: { playerID: string; score: number } };

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
    case "ADD_REVEALED_LETTER":
      return {
        ...state,
        revealedLetters: [...state.revealedLetters, action.payload],
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
              selectableWords: []
            },
        isSelectingWord: false,
      };
    case "SELECT_WORD_MODAL":
      return {
        ...state,
        isSelectingWord: true,
        selectableWords: action.payload.selectableWords,
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

    default:
      return state;
  }
};

const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<Action>;
  isInitialized: boolean;
  setInitialized: (value: boolean) => void;
} | null>(null);

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(gameReducer, {
    id: "",
    players: [],
    status: GameStatus.NotStarted,
    playerOrder: [],
    options: { roundLimit: 8, turnTimeLimit: 60, selectWordTimeLimit: 30 },
    round: null,
    turn: null,
    revealedLetters: [],
    selectableWords: [],
    isSelectingWord: false,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  return (
    <GameContext.Provider
      value={{
        state,
        dispatch,
        isInitialized,
        setInitialized: setIsInitialized,
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
