import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Users, X, Pencil } from "lucide-react";
import PreGameLobby from "@/components/game/lobby/pre-game-lobby";
import { GameProvider } from "@/providers/game-provider";
import Turn from "@/components/game/game_info/turn";
import Round from "@/components/game/game_info/round";
import Canvas from "@/components/game/canvas/canvas";
import Chat from "@/components/game/chat/chat";
import Lobby from "@/components/game/lobby/lobby";
import WordSelect from "@/components/game/word/word-select";
import GameStateUpdater from "@/components/game/game-state-updater";
import GameHeader from "@/components/game/game_info/game-header";

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
        <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
          <div className="container flex h-14 items-center px-2">
            <div className="flex items-center gap-2 mr-4">
              <Pencil className="h-5 w-5 text-purple-400" />
              <span className="font-semibold hidden md:inline-block">
                Pictionary Pals
              </span>
            </div>

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
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="p-4 pb-2">
              <GameHeader>
                <Round />
                <Turn />
              </GameHeader>
            </div>

            <div className="flex-1 p-4 pt-2 overflow-hidden flex items-center justify-center">
              <div className="w-full h-full max-w-full max-h-full flex items-center justify-center overflow-hidden">
                <Canvas />
              </div>
            </div>
          </div>

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

        <WordSelect />
      </div>
    </GameProvider>
  );
}
