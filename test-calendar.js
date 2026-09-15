const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const contents = await prisma.content.findMany({
    where: {
      publishDate: {
        gte: new Date("2026-08-31T00:00:00+07:00"),
        lte: new Date("2026-10-12T00:00:00+07:00")
      },
      status: { not: 'ARCHIVED' }
    },
    include: {
      pillar: true,
      assignedTo: { select: { id: true, name: true, image: true } }
    }
  });
  console.log(contents);
}
main().catch(console.error);
