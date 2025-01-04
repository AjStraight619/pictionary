import { useCustomWebsocket } from "@/hooks/useCustomWebsocket"
import { Button } from "../ui/button"
import { useEffect, useState } from "react"

const ActiveGames = () => {
  const { lastMessage, sendJsonMessage } = useCustomWebsocket({ messageTypes: ['active-games'] })
  const [activeGames, setActiveGames] = useState([])


  useEffect(() => {
    if (lastMessage) {
      const parsedMessage = JSON.parse(lastMessage.data)
      const activeGames = parsedMessage.payload
      setActiveGames(activeGames)

    }
  }, [lastMessage])
  const getActiveGameList = () => {
    sendJsonMessage({
      type: "active-games",
    })
  }
  return (
    <div className="flex flex-row items-center gap-2">
      <Button onClick={() => getActiveGameList()}>
        Show Active Games
      </Button>
      <span>{activeGames?.length}</span>
    </div>
  )
}


export default ActiveGames
