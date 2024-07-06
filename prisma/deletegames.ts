const db1 = require("./dbtest");

async function deleteGames() {
  const games = await db1.game.findMany();
  console.log("games: ", games.length);
  await db1.game.deleteMany();
}

deleteGames()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db1.$disconnect();
  });
