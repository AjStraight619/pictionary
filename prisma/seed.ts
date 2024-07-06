const db = require("./dbtest");

async function seedPlayers() {
  // Fetch the first game (or create one if necessary)
  let game = await db.game.findFirst();
  if (!game) {
    game = await db.game.create({
      data: {
        name: "Test Game",
        isOpen: true,
        status: "WAITING",
        currentRound: 1,
      },
    });
  }

  console.log("Seeding game: ", game);

  // Create players
  const playersData = [
    { id: "player1", username: "Player1", email: "player1@example.com" },
    { id: "player2", username: "Player2", email: "player2@example.com" },
    { id: "player3", username: "Player3", email: "player3@example.com" },
  ];

  for (const playerData of playersData) {
    let player = await db.player.upsert({
      where: { id: playerData.id },
      update: {},
      create: playerData,
    });

    await db.gamePlayer.create({
      data: {
        playerId: player.id,
        gameId: game.id,
        username: player.username,
        isLeader: false,
      },
    });

    console.log("Seeded player: ", player);
  }
}

seedPlayers()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
