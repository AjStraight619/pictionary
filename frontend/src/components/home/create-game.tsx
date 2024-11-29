import React, { useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { Input } from '../ui/input';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router';

// ! For now, we'll just persit the player info in local storage
// ? We can late move this to a database if needed

type FormState = {
  playerName: string;
};

export type PlayerInfo = {
  playerId: string;
  name: string;
};

const CreateGameForm = () => {
  const navigate = useNavigate();

  const [playerInfo, setPlayerInfo] = useLocalStorage<PlayerInfo | null>(
    'playerInfo',
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>({
    playerName: playerInfo?.name || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const { name, value } = e.target;
    setFormState({ ...formState, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) {
      setError('Player name must be between 1 and 12 characters');
      return;
    }
    const playerId = crypto.randomUUID();
    const gameId = crypto.randomUUID();

    setPlayerInfo({
      playerId,
      name: formState.playerName,
    });

    navigate(`/game/${gameId}`);
  };

  const validateForm = () => {
    return formState.playerName.length > 0 && formState.playerName.length < 12;
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Create Game</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="playerName">Player Name</Label>
          <Input
            id="playerName"
            name="playerName"
            value={formState.playerName}
            onChange={handleInputChange}
          />
          {error && <FormMessage message={error} />}
        </CardContent>
        <CardFooter>
          <Button type="submit">Submit</Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default CreateGameForm;

const FormMessage = ({ message }: { message: string }) => {
  return <p className="text-destructive">{message}</p>;
};
