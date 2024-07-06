import { useEffect, useState } from "react";
import { SendJsonMessage } from "react-use-websocket/dist/lib/types";

type UseWSMessageOptions = {
  sendJsonMessage: SendJsonMessage;
  lastMessage: MessageEvent<any> | null;
};

export const useWSMessage = ({
  sendJsonMessage,
  lastMessage,
}: UseWSMessageOptions) => {
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (lastMessage) {
    }
  }, [lastMessage]);
};
