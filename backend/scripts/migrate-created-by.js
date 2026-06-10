const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const users = await prisma.users.findMany({ select: { id: true, username: true } });
  console.log('Users:', JSON.stringify(users));
  if (users.length > 0) {
    const result = await prisma.warga.updateMany({
      where: { created_by: null },
      data: { created_by: users[0].id },
    });
    console.log('Updated warga:', result.count, 'rows to user', users[0].id);
  } else {
    console.log('No users found');
  }
  const count = await prisma.warga.count();
  console.log('Total warga:', count);
  await prisma.$disconnect();
})();
