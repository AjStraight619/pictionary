import { useCustomWebsocket } from "@/hooks/useCustomWebsocket"
import { Player } from "@/types/lobby"
import { parse } from "path"
import { useEffect, useState } from "react"

const PreGameLobby = () => {
  const { lastMessage } = useCustomWebsocket({ messageTypes: ['game-state'] })
  const [players, setPlayers] = useState<Player[]>([])
  useEffect(() => {
    if (lastMessage) {
      const parsedMessage = JSON.parse(lastMessage.data).payload
      const players = parsedMessage.players
      setPlayers(players)
    }
  }, [lastMessage])
  return (
    <div>

    </div>
  )
}
