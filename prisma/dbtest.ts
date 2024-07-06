const { PrismaClient } = require("@Prisma/client");
const dbtest = new PrismaClient();

module.exports = dbtest;
