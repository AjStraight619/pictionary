if (gameStatus === GameStatus.NotStarted) {
  return null;
}

if (!currentWord) {
  // Don't show anything if we don't have a player drawing yet
  if (!playerDrawing) {
    return (
      <div className="flex items-center justify-center h-16 bg-card rounded-lg border shadow-sm">
        <p className="text-muted-foreground">Waiting for next turn...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-16 bg-card rounded-lg border shadow-sm">
      <p className="text-muted-foreground">
        {`${playerDrawing.username} is selecting a word...`}
      </p>
    </div>
  );
}
