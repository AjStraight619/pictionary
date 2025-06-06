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

type FormState = {
  playerName: string;
  gameId: string;
};

const JoinGameForm = () => {
  const navigate = useNavigate();
  const [playerInfo, setPlayerInfo] = useLocalStorage<PlayerInfo | null>(
    "playerInfo",
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formState, setFormState] = useState<FormState>({
    playerName: playerInfo?.username || "",
    gameId: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const { name, value } = e.target;

    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setError(null);
    e.preventDefault();
    if (!validateForm()) return;

    // Generate gameId and playerId

    const playerID = crypto.randomUUID();

    // Prepare the payload
    const payload = {
      gameId: formState.gameId,
      playerID,
      playerName: formState.playerName,
    };

    setIsLoading(true);
    try {
      // Send the game creation request to the server
      const res = await fetch(`${API_URL}/game/join`, {
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

      // Store player info locally
      setPlayerInfo({
        playerID,
        username: formState.playerName,
      });

      // Navigate to the game page using the created gameId
      navigate(`/game/${formState.gameId}`);
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
              htmlFor="gameId"
              className="text-sm font-medium text-gray-600"
            >
              Game Id
            </Label>
            <Input
              id="gameId"
              name="gameId"
              type="text"
              value={formState.gameId}
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
              <span>Join Game</span>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default JoinGameForm;

const FormMessage = ({ message }: { message: string }) => (
  <p className="text-red-500 text-sm font-medium">{message}</p>
);
