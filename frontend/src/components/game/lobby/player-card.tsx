import { Check, Crown, Pencil, X } from "lucide-react";
import { motion } from "framer-motion";
import Score from "../player/score";

type PlayerCardProps = {
  name: string;
  score: number;
  isHost: boolean;
  isDrawing: boolean;
  color: string;
  isReady?: boolean;
  isPreGame: boolean;
};

const PlayerCard = ({
  name,
  score,
  isHost,
  isDrawing,
  color,
  isReady,
  isPreGame,
}: PlayerCardProps) => {
  const bgColor = color ? `${color}20` : "bg-muted";
  const textColor = color || "text-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-lg border p-3 flex items-center gap-3 ${
        isDrawing
          ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
          : ""
      }`}
      style={{ backgroundColor: bgColor }}
    >
      {/* Avatar/Initial */}
      <div
        className="h-9 w-9 rounded-full flex items-center justify-center text-white"
        style={{ backgroundColor: color || "#6366f1" }}
      >
        {name.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="font-medium truncate" style={{ color: textColor }}>
            {name}
          </p>
          {isHost && (
            <Crown className="h-3.5 w-3.5 text-yellow-400 flex-shrink-0" />
          )}
          {isDrawing && (
            <Pencil className="h-3.5 w-3.5 text-primary flex-shrink-0" />
          )}
        </div>
        <Score score={score} />
      </div>

      {isPreGame && (
        <div className="inline-flex items-center gap-2">
          {isReady ? (
            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
          ) : (
            <X className="h-4 w-4 text-red-500 flex-shrink-0" />
          )}
        </div>
      )}
    </motion.div>
  );
};

export default PlayerCard;
