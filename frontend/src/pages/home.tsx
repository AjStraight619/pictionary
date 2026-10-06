import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Users, Play, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "usehooks-ts";
import type { PlayerInfo } from "@/types/lobby";
import { AnimatedSvgElements } from "@/components/home/animated-svg-elements";
import { API_URL } from "@/utils/config";
import { cn } from "@/lib/utils";
import { useSession } from "@/providers/session-provider";
import { LogoutButton } from "@/components/auth/logout-button";

type GameOptions = {
  roundLimit: number;
  turnTimeLimit: number;
  selectWordTimeLimit: number;
  maxPlayers: number;
};

export default function Home() {
  const navigate = useNavigate();
  const [playerInfo, setPlayerInfo] = useLocalStorage<PlayerInfo | null>(
    "playerInfo",
    null
  );

  const { user } = useSession();

  // Form states
  const [username, setUsername] = useState(
    playerInfo?.username || user?.username || ""
  );
  const [gameCode, setGameCode] = useState("");
  const [gameOptions, setGameOptions] = useState<GameOptions>({
    roundLimit: 3,
    turnTimeLimit: 40,
    selectWordTimeLimit: 10,
    maxPlayers: 4,
  });

  // UI states
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");

  // Handle create game form submission
  const handleCreateGame = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("Please sign in to create a game.");
      return;
    }

    // Validate form
    if (username.length < 3 || username.length > 12) {
      setError("Player name must be between 3 and 12 characters.");
      return;
    }

    const { roundLimit, turnTimeLimit, selectWordTimeLimit, maxPlayers } =
      gameOptions;

    if (roundLimit < 3 || roundLimit > 10) {
      setError("Max Rounds must be between 3 and 10.");
      return;
    }

    if (turnTimeLimit < 40 || turnTimeLimit > 80) {
      setError("Round Timer must be between 40 and 80 seconds.");
      return;
    }

    if (selectWordTimeLimit < 10 || selectWordTimeLimit > 30) {
      setError("Word Select Timer must be between 10 and 30 seconds.");
      return;
    }

    if (maxPlayers < 2 || maxPlayers > 8) {
      setError("Max Players must be between 2 and 8.");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        userID: user.id,
        username,
        options: gameOptions,
      };

      // Send the game creation request to the server
      const res = await fetch(`${API_URL}/game/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.error || "Failed to create the game.");
        return;
      }

      const data = await res.json();
      const gameID = data.gameID;
      const playerID = data.playerID;

      setPlayerInfo({
        playerID,
        username,
      });

      navigate(`/game/${gameID}`);
    } catch (error) {
      console.error("Error creating the game:", error);
      setError("Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGame = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("Please sign in to join a game.");
      return;
    }

    // Validate form
    if (username.length < 3 || username.length > 12) {
      setError("Player name must be between 3 and 12 characters.");
      return;
    }

    if (!gameCode.trim()) {
      setError("Game code is required.");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        userID: user.id,
        gameID: gameCode.trim(),
        username,
      };

      const res = await fetch(`${API_URL}/game/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.error || "Failed to join the game.");
        return;
      }

      const data = await res.json();
      const playerID = data.playerID;

      // Store player info locally
      setPlayerInfo({
        playerID,
        username,
      });

      navigate(`/game/${gameCode.trim()}`);
    } catch (error) {
      console.error("Error joining the game:", error);
      setError("Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle option change in create game form
  const handleOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setGameOptions((prev) => ({
      ...prev,
      [name]: Number.parseInt(value, 10),
    }));
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <header className="border-b border-border relative z-20">
        <div className="max-w-6xl mx-auto flex min-h-16 items-center justify-between gap-3 px-6">
          <div className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            <span className="font-semibold">Pictionary Pals</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {user && (
              <span className="hidden sm:inline text-sm text-muted-foreground">
                Hi, {user.username}
              </span>
            )}
            <LogoutButton />
          </div>
        </div>
      </header>


      <div className="max-w-6xl px-6 py-6 lg:py-4 mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">A little creativity. A lot of laughs.</p>
            <h1 className="text-[2.5rem] sm:text-5xl font-semibold tracking-tight leading-[1.08]">
              Good friends.<br />Bad drawings.<br /><span className="text-primary">Great guesses.</span>
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground max-w-md">
              Draw pictures. Guess words. Play with friends.
            </p>
            <AnimatedSvgElements />
            <p className="text-sm text-muted-foreground">No art skills required. That’s half the fun.</p>
          </div>

          <div
            className="bg-card rounded-2xl border border-border p-2 shadow-[0_8px_32px_rgba(42,47,43,0.05)]"
          >
            <Tabs
              defaultValue="create"
              value={activeTab}
              onValueChange={(value) => {
                setActiveTab(value as "create" | "join");
                setError(null);
              }}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 w-full bg-muted p-1 h-11">
                <TabsTrigger
                  value="create"
                  className="h-9 data-[state=active]:bg-card data-[state=active]:text-primary"
                >
                  Create Game
                </TabsTrigger>
                <TabsTrigger
                  value="join"
                  className="h-9 data-[state=active]:bg-card data-[state=active]:text-primary"
                >
                  Join Game
                </TabsTrigger>
              </TabsList>
              <TabsContent
                value="create"
                className="p-4 space-y-4 min-h-[360px]"
              >
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">
                    Create a New Game
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Set up a room and invite your friends to play!
                  </p>
                </div>

                <form onSubmit={handleCreateGame} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="username" className="text-sm font-medium">
                      Your Nickname
                    </label>
                    <Input
                      className="bg-background"
                      id="username"
                      placeholder="Enter your nickname"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setError(null);
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="roundLimit"
                        className="text-sm font-medium"
                      >
                        Rounds
                      </label>
                      <SelectableOptions
                        id="roundLimit"
                        name="roundLimit"
                        value={gameOptions.roundLimit}
                        options={{
                          "3": "3 Rounds",
                          "6": "6 Rounds",
                          "10": "10 Rounds",
                        }}
                        onChange={handleOptionChange}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="maxPlayers"
                        className="text-sm font-medium"
                      >
                        Max Players
                      </label>
                      <SelectableOptions
                        id="maxPlayers"
                        name="maxPlayers"
                        value={gameOptions.maxPlayers}
                        options={{
                          "4": "4 Players",
                          "6": "6 Players",
                        }}
                        onChange={handleOptionChange}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="turnTimeLimit"
                        className="text-sm font-medium"
                      >
                        Turn Timer (sec)
                      </label>
                      <SelectableOptions
                        id="turnTimeLimit"
                        name="turnTimeLimit"
                        value={gameOptions.turnTimeLimit}
                        options={{
                          "40": "40 Seconds",
                          "60": "60 Seconds",
                          "80": "80 Seconds",
                        }}
                        onChange={handleOptionChange}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="selectWordTimeLimit"
                        className="text-sm font-medium"
                      >
                        Word Select (sec)
                      </label>
                      <SelectableOptions
                        id="selectWordTimeLimit"
                        name="selectWordTimeLimit"
                        value={gameOptions.selectWordTimeLimit}
                        options={{
                          "10": "10 Seconds",
                          "20": "20 Seconds",
                        }}
                        onChange={handleOptionChange}
                      />
                    </div>
                  </div>

                  {error && (
                    <p role="alert" className="text-destructive text-sm font-medium">{error}</p>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 gap-2 font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <><Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" /> Please wait…</>
                    ) : (
                      <>
                        Create Game
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="join" className="p-4 space-y-4 min-h-[360px]">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">
                    Join Existing Game
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Enter a game code to join your friends!
                  </p>
                </div>

                <form onSubmit={handleJoinGame} className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="join-username"
                      className="text-sm font-medium"
                    >
                      Your Nickname
                    </label>
                    <Input
                      id="join-username"
                      className="bg-background"
                      placeholder="Enter your nickname"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setError(null);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="game-code" className="text-sm font-medium">
                      Game Code
                    </label>
                    <Input
                      id="game-code"
                      className="bg-background"
                      placeholder="Enter game code"
                      value={gameCode}
                      onChange={(e) => {
                        setGameCode(e.target.value);
                        setError(null);
                      }}
                    />
                  </div>

                  {error && (
                    <p role="alert" className="text-destructive text-sm font-medium">{error}</p>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 gap-2 font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <><Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" /> Please wait…</>
                    ) : (
                      <>
                        Join Game
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div
          className="pt-4 mt-5 border-t border-border"
        >
          <h3 className="text-lg font-semibold mb-3">
            How to Play
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: "Create or Join",
                description:
                  "Start a room or enter a friend’s code.",
                icon: <Users className="h-7 w-7 text-primary" />,
              },
              {
                title: "Draw & Guess",
                description:
                  "One player draws. Everyone else guesses.",
                icon: <Pencil className="h-7 w-7 text-[hsl(var(--sketch-clay))]" />,
              },
              {
                title: "Win Points",
                description:
                  "Guess correctly to earn points.",
                icon: <Play className="h-7 w-7 text-[hsl(var(--sketch-sage))]" />,
              },
            ].map((item, index) => (
              <div
                key={index}
              >
                <Card className="h-full bg-transparent border-0 shadow-none">
                  <CardHeader className="flex-row items-center gap-3 space-y-0 px-0 pt-0 pb-2">
                    <div>{item.icon}</div>
                    <CardTitle className="text-foreground">
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    <CardDescription className="text-muted-foreground leading-relaxed">
                      {item.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SelectableOptions({
  id,
  name,
  options,
  value,
  onChange,
  className,
}: {
  id: string;
  name: string;
  value: number;
  options: Record<string, string>; // key is the value, value is the label <option value="10">10 Seconds</option>
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
}) {
  return (
    <select
      id={id}
      name={name}
      value={value}
      className={cn(
        "w-full h-10 px-3 rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      onChange={onChange}
    >
      {Object.entries(options).map(([key, value]) => (
        <option key={key} value={key}>
          {value}
        </option>
      ))}
    </select>
  );
}
