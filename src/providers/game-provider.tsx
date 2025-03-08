import { GameStatus } from "@/types/game";
import { Player, PlayerInfo } from "@/types/lobby";
import React, {
  createContext,
  SetStateAction,
  useContext,
  useMemo,
  useState,
} from "react";
import { useReadLocalStorage } from "usehooks-ts";

type GameContextType = {
  players: Player[];
  setPlayers: React.Dispatch<SetStateAction<Player[]>>;
  gameStatus?: GameStatus;
  isDrawingPlayer?: boolean;
};

const GameContext = createContext<GameContextType | null>(null);

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus | undefined>(
    undefined,
  );

  const playerInfo = useReadLocalStorage<PlayerInfo | null>("playerInfo");

  const isDrawingPlayer = useMemo(() => {
    return players.some(
      (p) => p.isDrawing && p.playerID === playerInfo?.playerID,
    );
  }, [players, playerInfo?.playerID]);

  return (
    <GameContext.Provider
      value={{
        players,
        setPlayers,
        gameStatus,
        isDrawingPlayer,
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
