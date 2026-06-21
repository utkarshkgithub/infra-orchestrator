import { prisma } from "../src/lib/prisma.js";

async function main() {
  const user = await prisma.user.upsert({
    where: {
      login: "dev",
    },
    update: {},
    create: {
      id: 1,
      name: "Dev User",
      email: "dev@example.com",
      login: "dev",
      accessToken: "dev-token",
      avatarUrl: "https://picsum.photos/200",
    },
  });

  console.log("Seeded user:", {
    id: user.id,
    login: user.login,
    email: user.email,
  });
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });