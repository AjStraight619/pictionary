import type React from "react";
import { useState } from "react";
import { motion } from "framer-motion";
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
import { Link, useNavigate } from "react-router-dom";
import { useLocalStorage } from "usehooks-ts";
import type { PlayerInfo } from "@/types/lobby";
import { DoodleElements } from "@/components/home/doodle-elements";

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

  // Form states
  const [username, setUsername] = useState(playerInfo?.username || "");
  const [gameCode, setGameCode] = useState("");
  const [gameOptions, setGameOptions] = useState<GameOptions>({
    roundLimit: 6,
    turnTimeLimit: 60,
    selectWordTimeLimit: 20,
    maxPlayers: 6,
  });

  // UI states
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");

  // Handle quick play button
  const handleQuickPlay = async () => {
    if (username.length < 3 || username.length > 12) {
      setError("Player name must be between 3 and 12 characters.");
      return;
    }

    setIsLoading(true);

    try {
      // Use the create game API with default options
      const payload = {
        username,
        options: {
          roundLimit: 6,
          turnTimeLimit: 60,
          selectWordTimeLimit: 20,
          maxPlayers: 6,
        },
      };

      const res = await fetch("http://localhost:8000/game/create", {
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
      const gameID = data.gameID;
      const playerID = data.playerID;

      // Store player info locally
      setPlayerInfo({
        playerID,
        username,
      });

      // Navigate to the game
      navigate(`/game/${gameID}`);
    } catch (error) {
      console.error("Error creating the game:", error);
      setError("Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle create game form submission
  const handleCreateGame = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

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
      // Prepare the payload
      const payload = {
        username,
        options: gameOptions,
      };

      // Send the game creation request to the server
      const res = await fetch("http://localhost:8080/game/create", {
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
      const gameID = data.gameID;
      const playerID = data.playerID;

      // Store player info locally
      setPlayerInfo({
        playerID,
        username,
      });

      // Navigate to the game
      navigate(`/game/${gameID}`);
    } catch (error) {
      console.error("Error creating the game:", error);
      setError("Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle join game form submission
  const handleJoinGame = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

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
      // Prepare the payload (without playerID)
      const payload = {
        gameId: gameCode,
        playerName: username,
      };

      // Send the join game request to the server
      const res = await fetch("http://localhost:8080/join-game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.error || "Failed to join the game.");
        return;
      }

      const data = await res.json();
      const playerID = data.playerID; // Get playerID from server response

      // Store player info locally
      setPlayerInfo({
        playerID,
        username,
      });

      // Navigate to the game
      navigate(`/game/${gameCode}`);
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
    <div className="min-h-screen dark bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900 via-indigo-900 to-blue-950 relative overflow-hidden">
      {/* Cartoon Clouds Background */}
      <DoodleElements />

      <div className="container px-4 py-8 mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-12">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
              Draw, Guess, Laugh!
            </h2>
            <p className="text-xl text-yellow-100">
              The ultimate online Pictionary experience. Create a room, invite
              your friends, and let the drawing battles begin!
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="gap-2 bg-gradient-to-r from-yellow-400 to-pink-500 hover:from-yellow-500 hover:to-pink-600 text-black font-bold shadow-[0_0_15px_rgba(255,214,0,0.5)] hover:shadow-[0_0_20px_rgba(255,214,0,0.7)] transition-all duration-300"
                onClick={handleQuickPlay}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Play Now
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-yellow-400 text-yellow-400 hover:text-yellow-300 hover:border-yellow-300 hover:bg-purple-900/30"
              >
                Learn More
              </Button>
            </div>
            <div className="flex items-center gap-2 text-yellow-300">
              {/* <Users className="h-4 w-4" />
              <span className="text-sm">1,234 players online now</span> */}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-indigo-950/80 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.3)] border-2 border-indigo-500/50"
          >
            <Tabs
              defaultValue="create"
              value={activeTab}
              onValueChange={(value) => {
                setActiveTab(value as "create" | "join");
                setError(null);
                // This helps reset any height differences
                setTimeout(() => window.dispatchEvent(new Event("resize")), 50);
              }}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 w-full bg-indigo-900 p-1">
                <TabsTrigger
                  value="create"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-400 data-[state=active]:to-pink-500 data-[state=active]:text-black data-[state=active]:font-bold"
                >
                  Create Game
                </TabsTrigger>
                <TabsTrigger
                  value="join"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-400 data-[state=active]:to-pink-500 data-[state=active]:text-black data-[state=active]:font-bold"
                >
                  Join Game
                </TabsTrigger>
              </TabsList>

              {/* Create Game Tab */}
              <TabsContent
                value="create"
                className="p-6 space-y-4 min-h-[320px]"
              >
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-yellow-400">
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
                      <select
                        id="roundLimit"
                        name="roundLimit"
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        value={gameOptions.roundLimit}
                        onChange={handleOptionChange}
                      >
                        <option value="3">3 Rounds</option>
                        <option value="6">6 Rounds</option>
                        <option value="10">10 Rounds</option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="maxPlayers"
                        className="text-sm font-medium"
                      >
                        Max Players
                      </label>
                      <select
                        id="maxPlayers"
                        name="maxPlayers"
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        value={gameOptions.maxPlayers}
                        onChange={handleOptionChange}
                      >
                        <option value="4">4 Players</option>
                        <option value="6">6 Players</option>
                        <option value="8">8 Players</option>
                      </select>
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
                      <select
                        id="turnTimeLimit"
                        name="turnTimeLimit"
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        value={gameOptions.turnTimeLimit}
                        onChange={handleOptionChange}
                      >
                        <option value="40">40 Seconds</option>
                        <option value="60">60 Seconds</option>
                        <option value="80">80 Seconds</option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="selectWordTimeLimit"
                        className="text-sm font-medium"
                      >
                        Word Select (sec)
                      </label>
                      <select
                        id="selectWordTimeLimit"
                        name="selectWordTimeLimit"
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        value={gameOptions.selectWordTimeLimit}
                        onChange={handleOptionChange}
                      >
                        <option value="10">10 Seconds</option>
                        <option value="20">20 Seconds</option>
                        <option value="30">30 Seconds</option>
                      </select>
                    </div>
                  </div>

                  {error && (
                    <p className="text-red-500 text-sm font-medium">{error}</p>
                  )}

                  <Button
                    type="submit"
                    className="w-full gap-2 bg-gradient-to-r from-yellow-400 to-pink-500 hover:from-yellow-500 hover:to-pink-600 text-black font-bold shadow-[0_0_10px_rgba(255,214,0,0.3)] hover:shadow-[0_0_15px_rgba(255,214,0,0.5)] transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Create Game
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Join Game Tab */}
              <TabsContent value="join" className="p-6 space-y-4 min-h-[320px]">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-yellow-400">
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
                      placeholder="Enter game code"
                      value={gameCode}
                      onChange={(e) => {
                        setGameCode(e.target.value);
                        setError(null);
                      }}
                    />
                  </div>

                  {error && (
                    <p className="text-red-500 text-sm font-medium">{error}</p>
                  )}

                  <Button
                    type="submit"
                    className="w-full gap-2 bg-gradient-to-r from-yellow-400 to-pink-500 hover:from-yellow-500 hover:to-pink-600 text-black font-bold shadow-[0_0_10px_rgba(255,214,0,0.3)] hover:shadow-[0_0_15px_rgba(255,214,0,0.5)] transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
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
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="py-16"
        >
          <h3 className="text-3xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500">
            How It Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Create or Join",
                description:
                  "Start a new game room or join an existing one with a game code",
                icon: <Users className="h-10 w-10 text-yellow-400" />,
              },
              {
                title: "Draw & Guess",
                description:
                  "Take turns drawing while others try to guess what you're creating",
                icon: <Pencil className="h-10 w-10 text-pink-400" />,
              },
              {
                title: "Win Points",
                description:
                  "Score points for correct guesses and artistic masterpieces",
                icon: <Play className="h-10 w-10 text-purple-400" />,
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.8 + index * 0.2 }}
              >
                <Card className="bg-indigo-950/80 border-2 border-indigo-500/50 hover:shadow-[0_0_15px_rgba(139,92,246,0.5)] transition-all duration-300">
                  <CardHeader className="pb-2">
                    <div className="mb-2">{item.icon}</div>
                    <CardTitle className="text-yellow-400">
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-yellow-100">
                      {item.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const Navbar = () => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="flex justify-between items-center mb-12"
  >
    <div className="flex items-center gap-2">
      <Pencil className="h-8 w-8 text-yellow-400" />
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500">
        Pictionary Pals
      </h1>
    </div>
    <div className="flex gap-4">
      <Button
        variant="ghost"
        size="sm"
        className="text-yellow-400 hover:text-yellow-300 hover:bg-purple-800/50"
      >
        How to Play
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-yellow-400 hover:text-yellow-300 hover:bg-purple-800/50"
      >
        About
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="border-yellow-400 text-yellow-400 hover:bg-yellow-400/10 hover:text-yellow-300"
      >
        Sign In
      </Button>
    </div>
  </motion.div>
);

const Footer = () => (
  <footer className="border-t border-indigo-500/50 bg-indigo-950/80">
    <div className="container px-4 py-6 mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Pencil className="h-5 w-5 text-yellow-400" />
          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-500">
            Pictionary Pals
          </span>
        </div>
        <div className="flex gap-6">
          <Link
            to="#"
            className="text-sm text-yellow-400/70 hover:text-yellow-400"
          >
            Privacy Policy
          </Link>
          <Link
            to="#"
            className="text-sm text-yellow-400/70 hover:text-yellow-400"
          >
            Terms of Service
          </Link>
          <Link
            to="#"
            className="text-sm text-yellow-400/70 hover:text-yellow-400"
          >
            Contact
          </Link>
        </div>
        <div className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Pictionary Pals. All rights reserved.
        </div>
      </div>
    </div>
  </footer>
);
