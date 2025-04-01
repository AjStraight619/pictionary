import React, { useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { Input } from "../ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";
import { PlayerInfo } from "@/types/lobby";
import { API_URL } from "@/utils/config";

type GameOptions = {
  roundLimit: number;
  turnTimeLimit: number;
  selectWordTimeLimit: number;
  maxPlayers: number;
};

type FormState = {
  playerName: string;
  gameOptions: GameOptions;
};

const CreateGameForm = () => {
  const navigate = useNavigate();
  const [playerInfo, setPlayerInfo] = useLocalStorage<PlayerInfo | null>(
    "playerInfo",
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formState, setFormState] = useState<FormState>({
    playerName: playerInfo?.username || "",
    // Default game options
    gameOptions: {
      maxPlayers: 6,
      roundLimit: 6,
      turnTimeLimit: 60,
      selectWordTimeLimit: 20,
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const { name, value } = e.target;

    setFormState((prev) => ({
      ...prev,
      ...(name in prev.gameOptions
        ? {
            gameOptions: {
              ...prev.gameOptions,
              [name]: parseInt(value, 10) || 0,
            },
          }
        : { [name]: value }),
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setError(null);
    e.preventDefault();
    if (!validateForm()) return;

    // Generate gameId and playerId
    //const gameId = crypto.randomUUID();

    // Prepare the payload
    const payload = {
      username: formState.playerName,
      options: formState.gameOptions,
    };

    setIsLoading(true);
    try {
      // Send the game creation request to the server
      const res = await fetch(`${API_URL}/game/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.error || "Failed to create the game.");
        return;
      }

      const data = await res.json();
      console.log("Game created successfully:", data);

      const gameID = data.gameID;
      const playerID = data.playerID;

      // Store player info locally
      setPlayerInfo({
        playerID,
        username: formState.playerName,
      });

      navigate(`/game/${gameID}`);
    } catch (error) {
      console.error("Error creating the game:", error);
      setError("Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    if (formState.playerName.length < 3 || formState.playerName.length > 12) {
      setError("Player name must be between 3 and 12 characters.");
      return false;
    }
    const { roundLimit, turnTimeLimit, selectWordTimeLimit } =
      formState.gameOptions;
    if (roundLimit < 3 || roundLimit > 10) {
      setError("Max Rounds must be between 3 and 10.");
      return false;
    }
    if (turnTimeLimit < 40 || turnTimeLimit > 80) {
      setError("Round Timer must be between 40 and 80 seconds.");
      return false;
    }
    if (selectWordTimeLimit < 10 || selectWordTimeLimit > 30) {
      setError("Word Select Timer must be between 10 and 30 seconds.");
      return false;
    }
    return true;
  };

  return (
    <Card className="p-6 w-full rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-muted-foreground">
            Create Game
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Player Name */}
          <div className="space-y-1">
            <Label
              htmlFor="playerName"
              className="text-sm font-medium text-gray-600"
            >
              Player Name
            </Label>
            <Input
              id="playerName"
              name="playerName"
              value={formState.playerName}
              onChange={handleInputChange}
            />
          </div>

          {/* Game Options */}
          <div className="space-y-1">
            <Label
              htmlFor="roundLimit"
              className="text-sm font-medium text-gray-600"
            >
              Round Limit
            </Label>
            <Input
              id="roundLimit"
              name="roundLimit"
              type="number"
              min={3}
              max={10}
              value={formState.gameOptions.roundLimit}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-1">
            <Label
              htmlFor="turnTimeLimit"
              className="text-sm font-medium text-gray-600"
            >
              Turn Timer (seconds)
            </Label>
            <Input
              id="turnTimeLimit"
              name="turnTimeLimit"
              type="number"
              min={40}
              max={80}
              value={formState.gameOptions.turnTimeLimit}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-1">
            <Label
              htmlFor="selectWordTimeLimit"
              className="text-sm font-medium text-gray-600"
            >
              Word Select Timer (seconds)
            </Label>
            <Input
              id="selectWordTimeLimit"
              name="selectWordTimeLimit"
              type="number"
              min={10}
              max={30}
              value={formState.gameOptions.selectWordTimeLimit}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-1">
            <Label
              htmlFor="maxPlayers"
              className="text-sm font-medium text-gray-600"
            >
              Max Players
            </Label>
            <Input
              id="maxPlayers"
              name="maxPlayers"
              type="number"
              min={2}
              max={8}
              value={formState.gameOptions.maxPlayers}
              onChange={handleInputChange}
            />
          </div>

          {/* Error Message */}
          {error && <FormMessage message={error} />}
        </CardContent>

        <CardFooter className="flex justify-center">
          <Button disabled={isLoading} type="submit">
            {isLoading ? (
              <Loader2 className="animate-spin w-full" />
            ) : (
              <span>Create Game</span>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default CreateGameForm;

const FormMessage = ({ message }: { message: string }) => (
  <p className="text-red-500 text-sm font-medium">{message}</p>
);
