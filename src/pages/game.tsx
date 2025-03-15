// import Canvas from "@/components/game/canvas/canvas";
// import Chat from "@/components/game/chat/chat";
// import GameStateUpdater from "@/components/game/game-state-updater";
// import Lobby from "@/components/game/lobby/lobby";
// import PreGameLobby from "@/components/game/lobby/pre-game-lobby";
// import WordToGuess from "@/components/game/word/word";
// import WordSelect from "@/components/game/word/word-select";
// import { GameProvider } from "@/providers/game-provider";

// const Game = () => {
//   return (
//     <GameProvider>
//       <GameStateUpdater />
//       <div className="flex flex-col min-h-screen items-center justify-between p-12">
//         <div className="flex flex-row items-stretch justify-center w-full container gap-x-4 min-h-[12rem] max-h-[12rem]">
//           <PreGameLobby />
//           <WordSelect />
//           <div className="hidden md:block w-full">
//             <Lobby />
//           </div>
//           <div className="hidden md:block h-full">
//             <Chat />
//           </div>
//         </div>
//         <WordToGuess />
//         <Canvas />
//       </div>
//     </GameProvider>
//   );
// };

// export default Game;

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Users, X, Pencil, Clock } from "lucide-react";
import PreGameLobby from "@/components/game/lobby/pre-game-lobby";
import { GameProvider } from "@/providers/game-provider";
import Turn from "@/components/game/turn/turn";
import Canvas from "@/components/game/canvas/canvas";
import Chat from "@/components/game/chat/chat";
import Lobby from "@/components/game/lobby/lobby";
import WordSelect from "@/components/game/word/word-select";
import GameStateUpdater from "@/components/game/game-state-updater";

export default function Test() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "players">("chat");
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );

  // Track window size for responsive adjustments
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Automatically close sidebar on larger screens
  useEffect(() => {
    if (windowWidth >= 768 && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [windowWidth, sidebarOpen]);

  return (
    <GameProvider>
      <GameStateUpdater />
      <div className="flex flex-col h-screen bg-gradient-to-b from-background to-background/80 dark overflow-hidden">
        {/* Game Header */}
        <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
          <div className="container flex h-14 items-center">
            <div className="flex items-center gap-2 mr-4">
              <Pencil className="h-5 w-5 text-purple-400" />
              <span className="font-semibold hidden md:inline-block">
                Pictionary Pals
              </span>
            </div>

            {/* Mobile sidebar toggle */}
            <div className="flex md:hidden ml-auto">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="mr-2"
              >
                {activeTab === "chat" ? (
                  <MessageSquare className="h-5 w-5" />
                ) : (
                  <Users className="h-5 w-5" />
                )}
              </Button>
            </div>

            {/* Timer display */}
            <div className="hidden md:flex items-center gap-2 ml-auto">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Round 2/10</span>
            </div>
          </div>
        </header>

        {/* Main Game Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Canvas and Word Area */}
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Turn component (contains Word and game status) */}
            <div className="p-4 pb-2">
              <Turn />
            </div>

            {/* Canvas Area - Taking all available space */}
            <div className="flex-1 p-4 pt-2 overflow-hidden flex items-center justify-center">
              <div className="w-full h-full max-w-full max-h-full flex items-center justify-center bg-card rounded-lg border shadow-sm overflow-hidden">
                <Canvas />
              </div>
            </div>
          </div>

          {/* Sidebar - Desktop */}
          <div className="hidden md:flex flex-col w-[320px] border-l border-border/40 bg-background/95 overflow-hidden">
            <Tabs defaultValue="chat" className="h-full flex flex-col">
              <div className="flex items-center justify-between p-3 border-b">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                  <TabsTrigger value="players">Players</TabsTrigger>
                </TabsList>
              </div>
              <div className="flex-1 overflow-hidden">
                <TabsContent
                  value="chat"
                  className="h-full m-0 data-[state=active]:flex flex-col"
                >
                  <Chat />
                </TabsContent>
                <TabsContent
                  value="players"
                  className="h-full m-0 data-[state=active]:flex flex-col"
                >
                  <Lobby />
                </TabsContent>
              </div>
              <div className="border-t p-3">
                <PreGameLobby />
              </div>
            </Tabs>
          </div>

          {/* Mobile Sidebar */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                className="md:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <motion.div
                  className="fixed inset-y-0 right-0 w-full max-w-xs bg-background border-l shadow-lg flex flex-col"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <div className="flex items-center justify-between p-4 border-b">
                    <Tabs
                      value={activeTab}
                      onValueChange={(value) =>
                        setActiveTab(value as "chat" | "players")
                      }
                      className="w-full"
                    >
                      <TabsList className="grid grid-cols-2 w-full">
                        <TabsTrigger value="chat">Chat</TabsTrigger>
                        <TabsTrigger value="players">Players</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSidebarOpen(false)}
                      className="ml-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-auto">
                    {activeTab === "chat" ? <Chat /> : <Lobby />}
                  </div>
                  <div className="p-4 border-t">
                    <PreGameLobby />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Word Selection Dialog */}
        <WordSelect />
      </div>
    </GameProvider>
  );
}
