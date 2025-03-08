import { GameStatus } from "@/types/game";
import { Player, PlayerInfo } from "@/types/lobby";
import React, {
  createContext,
  SetStateAction,
  useContext,
  useReducer,
} from "react";
import { useReadLocalStorage } from "usehooks-ts";

type GameContextType = {
  players: Player[];
  setPlayers: React.Dispatch<SetStateAction<Player[]>>;
  gameStatus?: GameStatus;
  isDrawingPlayer?: boolean;
};

export type GameOptions = {};

export type Round = {
  // define your round type
  count: number;
  currentDrawerIdx: number;
  // etc.
};

type GameState = {
  id: string;
  players: Player[];
  playerOrder: string[];
  options: GameOptions;
  gameStatus: GameStatus;
  round: Round | null;
  wordToGuess: string;
  revealedLetters: string[];
};

type Action =
  | { type: "GAME_STATE_UPDATE"; payload: GameState }
  | { type: "PLAYER_JOINED"; payload: Player }
  | { type: "PLAYER_LEFT"; payload: string };

//const GameContext = createContext<GameContextType | null>(null);

const gameReducer = (state: GameState, action: Action): GameState => {
  switch (action.type) {
    case "GAME_STATE_UPDATE":
      return { ...state, ...action.payload };
    case "PLAYER_JOINED":
      return { ...state, players: [...state.players, action.payload] };
    case "PLAYER_LEFT":
      return {
        ...state,
        players: state.players.filter((p) => p.playerID !== action.payload),
      };
    default:
      return state;
  }
};

const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
  //const [players, setPlayers] = useState<Player[]>([]);
  //const [gameStatus, setGameStatus] = useState<GameStatus | undefined>(
  //  undefined,
  //);
  const [state, dispatch] = useReducer(gameReducer, {
    id: "",
    players: [],
    gameStatus: GameStatus.NotStarted,
    playerOrder: [],
    options: {},
    round: null,
    wordToGuess: "",
    revealedLetters: [],
  });
  //const playerInfo = useReadLocalStorage<PlayerInfo | null>("playerInfo");

  //const isDrawingPlayer = useMemo(() => {
  //  return players.some(
  //    (p) => p.isDrawing && p.playerID === playerInfo?.playerID,
  //  );
  //}, [players, playerInfo?.playerID]);

  return (
    <GameContext.Provider
      value={{
        //players,
        //setPlayers,
        //gameStatus,
        //isDrawingPlayer,
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
