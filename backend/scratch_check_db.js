import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const workers = await prisma.worker.findMany({
    select: { email: true, name: true, phone: true }
  });
  console.log('Worker Emails:', workers.map(w => w.email));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
