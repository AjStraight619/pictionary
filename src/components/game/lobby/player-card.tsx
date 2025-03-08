import { Crown, Pencil, PersonStanding } from "lucide-react";

const PlayerCard = ({
  isHost,
  isDrawing,
  name,
  score,
  color,
  connectionStatus,
}: {
  isHost: boolean;
  isDrawing: boolean;
  name: string;
  connectionStatus: string;
  score: number;
  color: string;
}) => {
  // Map connection status to a color
  const connectionColors: Record<string, string> = {
    Connecting: "bg-yellow-500",
    Open: "bg-green-500",
    Closing: "bg-orange-500",
    Closed: "bg-red-500",
    Uninstantiated: "bg-gray-500",
  };

  const hexToRgba = (hex: string, alpha: number): string => {
    // Remove the hash symbol if present
    hex = hex.replace(/^#/, "");

    // Parse r, g, b values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div
      className="px-2 py-1 rounded-md border"
      style={{
        borderColor: color,
        backgroundColor: `${hexToRgba(color, 0.1)}`,
      }}
    >
      <div className="flex items-center justify-between">
        {/* Left side: Icon, Name, and Connection Status */}
        <div className="flex items-center gap-2">
          {isDrawing ? <Pencil /> : null}
          {isHost ? <Crown /> : <PersonStanding />}
          <div>{name}</div>
          <div className="flex items-center gap-1">
            {/* Connection Status Circle */}
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                connectionColors[connectionStatus] || "bg-gray-400"
              }`}
            ></span>
          </div>
        </div>

        <div>{score}</div>
      </div>
    </div>
  );
};

export default PlayerCard;
